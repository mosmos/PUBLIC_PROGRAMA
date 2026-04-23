"""FastAPI service for Programa Wizard v2.

Endpoints:
  GET    /api/scenarios            — list all scenarios
  POST   /api/scenarios            — create or update a scenario
  DELETE /api/scenarios/{id}       — delete a scenario
  GET    /api/scenarios/{id}       — get one scenario with full payload
  POST   /api/calculate            — run calculation for a zone, return results
  GET    /api/rules                — return the merged rules catalog

Storage:
  - SQLite at simulations_data/v2.db (scenarios index table)
  - JSON payload files at simulations_data/v2/{id}.json
"""
from __future__ import annotations

import json
import math
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ─── Paths ────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "simulations_data" / "v2"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = ROOT / "simulations_data" / "v2.db"
RULES_FILE = ROOT / "rules.json"
RULES_EXTEND_FILE = ROOT / "rules_extend.json"


# ─── Rule loading ─────────────────────────────────────────────────────────
def load_rules() -> dict:
    rules = json.loads(RULES_FILE.read_text(encoding="utf-8"))
    if RULES_EXTEND_FILE.exists():
        ext = json.loads(RULES_EXTEND_FILE.read_text(encoding="utf-8"))
        rules["rules"] = rules.get("rules", []) + ext.get("rules", [])
    return rules


ALL_RULES = load_rules()


# ─── Calculation engine ───────────────────────────────────────────────────
def ceil_div(a: float, b: float) -> int:
    if b == 0:
        return 0
    return int(math.ceil(a / b))


def _to_num(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, bool):
        return float(x)
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        s = x.strip().replace(",", "")
        return float(s) if s else 0.0
    return 0.0


def build_context(zone: dict) -> dict[str, Any]:
    pop = zone.get("pop", {}) or {}
    ctx: dict[str, Any] = {}
    for k, v in pop.items():
        if k.isidentifier():
            ctx[k] = _to_num(v)
    # Housing + demographic globals (with safe defaults)
    ctx["housing_units"] = _to_num(zone.get("housing_units"))
    ctx["haredi_pct"] = _to_num(zone.get("haredi_pct"))
    ctx["special_education_pct"] = _to_num(zone.get("special_education_pct"))
    ctx["traditional_pct"] = _to_num(zone.get("traditional_pct"))
    ctx["age_14_17"] = _to_num(zone.get("age_14_17"))
    ctx["settlement_type"] = zone.get("settlement_type") or "B"
    return ctx


_ALLOWED = {"min": min, "max": max, "ceil_div": ceil_div, "abs": abs, "round": round}


def _eval(expr: str, ctx: dict) -> Any:
    env = {"__builtins__": {}}
    env.update(_ALLOWED)
    env.update(ctx)
    return eval(expr, env, {})


def run_rules(zone: dict, rules_data: dict | None = None) -> list[dict]:
    ctx = build_context(zone)
    rules_src = rules_data or ALL_RULES
    out: list[dict] = []
    for r in rules_src.get("rules", []):
        if not isinstance(r, dict):
            continue

        # is_active_condition: rules from rules_extend may only activate under a condition
        is_active = True
        cond = r.get("is_active_condition")
        if cond:
            try:
                is_active = bool(_eval(cond, ctx))
            except Exception:
                is_active = False

        base = {
            "category": r.get("category", ""),
            "service":  r.get("service", ""),
            "rule":     r.get("rule", r.get("rule_text", "")),
            "basis":    r.get("basis", ""),
            "notes":    r.get("notes", ""),
            "required_expr": r.get("required_expr", ""),
            "built_expr":    r.get("built_expr", ""),
            "land_expr":     r.get("land_expr", ""),
            "is_active_condition": cond,
            "isActive": is_active,
        }

        if not is_active:
            out.append({**base, "required_units": None, "built_sqm": None, "land_dunam": None})
            continue

        req = built = land = None
        try:
            if base["required_expr"].strip():
                rv = _eval(base["required_expr"], ctx)
                req = int(round(rv)) if abs(rv - round(rv)) < 1e-9 else float(rv)
            if base["built_expr"].strip():
                built = float(_eval(base["built_expr"], ctx))
            if base["land_expr"].strip():
                land = float(_eval(base["land_expr"], ctx))
        except Exception as e:
            req = f"ERROR: {type(e).__name__}: {e}"

        out.append({**base, "required_units": req, "built_sqm": built, "land_dunam": land})
    return out


# ─── SQLite storage ───────────────────────────────────────────────────────
def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
      CREATE TABLE IF NOT EXISTS scenarios (
        id          TEXT PRIMARY KEY,
        name        TEXT,
        area_label  TEXT,
        zone_type   TEXT,
        version     INTEGER,
        created_at  TEXT,
        updated_at  TEXT
      )
    """)
    return conn


def _json_path(sim_id: str) -> Path:
    return DATA_DIR / f"{sim_id}.json"


# ─── Models ───────────────────────────────────────────────────────────────
class CalcRequest(BaseModel):
    zone: dict
    rulesOverride: dict | None = None


# ─── App ──────────────────────────────────────────────────────────────────
app = FastAPI(title="Programa Calculator v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local test assets (calculator-test.html, rules.json, population_dummy.json)
app.mount("/static", StaticFiles(directory=ROOT, html=True), name="static")


@app.get("/")
def test_page():
    return FileResponse(ROOT / "calculator-test.html")


@app.get("/api/rules")
def get_rules():
    return ALL_RULES


@app.post("/api/calculate")
def calculate(req: CalcRequest):
    ctx = build_context(req.zone)
    results = run_rules(req.zone, req.rulesOverride)
    return {"ctx": ctx, "results": results}


@app.get("/api/scenarios")
def list_scenarios():
    with _db() as conn:
        rows = conn.execute("SELECT * FROM scenarios ORDER BY updated_at DESC").fetchall()
    sims: dict[str, dict] = {}
    for row in rows:
        p = _json_path(row["id"])
        if not p.exists():
            continue
        try:
            sims[row["id"]] = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
    return sims


@app.get("/api/scenarios/{sim_id}")
def get_scenario(sim_id: str):
    p = _json_path(sim_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail="not found")
    return json.loads(p.read_text(encoding="utf-8"))


@app.post("/api/scenarios")
def save_scenario(scenario: dict):
    sim_id = scenario.get("id")
    if not sim_id:
        raise HTTPException(status_code=400, detail="missing id")

    now = datetime.utcnow().isoformat()
    scenario["updated_at"] = scenario.get("updated_at") or now
    scenario["created_at"] = scenario.get("created_at") or now

    _json_path(sim_id).write_text(
        json.dumps(scenario, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    with _db() as conn:
        conn.execute("""
          INSERT INTO scenarios(id, name, area_label, zone_type, version, created_at, updated_at)
          VALUES(?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            area_label=excluded.area_label,
            zone_type=excluded.zone_type,
            version=excluded.version,
            updated_at=excluded.updated_at
        """, (
            sim_id,
            scenario.get("name", ""),
            scenario.get("area_label", ""),
            scenario.get("zone_type", ""),
            scenario.get("version", 1),
            scenario["created_at"],
            scenario["updated_at"],
        ))
    return {"ok": True, "id": sim_id}


@app.delete("/api/scenarios/{sim_id}")
def delete_scenario(sim_id: str):
    p = _json_path(sim_id)
    if p.exists():
        p.unlink()
    with _db() as conn:
        conn.execute("DELETE FROM scenarios WHERE id = ?", (sim_id,))
    return {"ok": True}
