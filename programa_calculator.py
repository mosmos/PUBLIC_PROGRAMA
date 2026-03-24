"""
Programa Calculator – Public Services Programming Workbench
Run: streamlit run programa_calculator.py
"""

import json
import math
import copy
import uuid
import sqlite3
from pathlib import Path
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import streamlit as st

# ─────────────────────────────────────────────────────────────────────────────
# Constants & defaults
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_POPULATION = {
    "population": {
        "total": 12000,
        "age_0_1": 220,
        "age_0_3": 650,
        "age_1_6": 1280,
        "age_0_6": 1500,
        "age_3_6": 850,
        "age_6_12": 1200,
        "age_12_18": 1050,
        "age_70_plus": 1400,
    },
    "globals": {
        "housing_units": 4500,
        "settlement_type": "B",
    },
}

DEFAULT_RULES = {
    "rules": [
        {
            "category": "Education",
            "service": "Daycare (0-3) - classes",
            "basis": "age_0_3",
            "rule_text": "50% participation / 20 kids per class; entry threshold 3 classes",
            "required_expr": "0 if ceil_div(age_0_3 * 0.5, 20) < 3 else ceil_div(age_0_3 * 0.5, 20)",
            "built_expr": "",
            "land_expr": "",
            "notes": "Participation 50% ages 0-3; avg 20 per class; minimum entry 3 classes.",
        },
        {
            "category": "Education",
            "service": "Kindergarten (3-6) - classes",
            "basis": "age_3_6",
            "rule_text": "100% participation / 30 kids per class",
            "required_expr": "ceil_div(age_3_6, 30)",
            "built_expr": "ceil_div(age_3_6, 30) * 130",
            "land_expr": "ceil_div(age_3_6, 30) * 0.5",
            "notes": "0.5 dunam/class; built 130 sqm + yard.",
        },
        {
            "category": "Education",
            "service": "Elementary school (models)",
            "basis": "age_6_12",
            "rule_text": "100% participation / 27 students per class",
            "required_expr": "ceil_div(age_6_12, 27)",
            "built_expr": "9050",
            "land_expr": "21.6",
            "notes": "Model mix example: 1x12, 1x18, 1x24 classes.",
        },
        {
            "category": "Education",
            "service": "Secondary school (models)",
            "basis": "age_12_18",
            "rule_text": "100% participation / 27 students per class",
            "required_expr": "ceil_div(age_12_18, 27)",
            "built_expr": "16150",
            "land_expr": "33",
            "notes": "Model mix example: 1x30, 1x36 classes.",
        },
        {
            "category": "Health",
            "service": "Family health station (Tipat Halav)",
            "basis": "age_0_6",
            "rule_text": "0-1: 100%; 1-6: 20%",
            "required_expr": "age_0_1 + (age_1_6 * 0.2)",
            "built_expr": "",
            "land_expr": "",
            "notes": "No dedicated land/build quotas.",
        },
        {
            "category": "Health",
            "service": "Neighborhood clinic",
            "basis": "total",
            "rule_text": "Avoid dedicated plot; minimum 0.5 dunam if combined",
            "required_expr": "1",
            "built_expr": "400",
            "land_expr": "0",
            "notes": "Medium clinic 300-500 sqm built.",
        },
        {
            "category": "Culture & Community",
            "service": "Youth club / youth movement",
            "basis": "age_12_18",
            "rule_text": "30-40% participation; 300-1000 regular users",
            "required_expr": "1 if (age_12_18 * 0.35) >= 300 else 0",
            "built_expr": "",
            "land_expr": "",
            "notes": "35% participation reference sizing.",
        },
        {
            "category": "Culture & Community",
            "service": "Senior club (70+)",
            "basis": "age_70_plus",
            "rule_text": "15% participation; 200-250 regular users; 250-300 sqm built",
            "required_expr": "1 if (age_70_plus * 0.15) >= 200 else 0",
            "built_expr": "275 if (age_70_plus * 0.15) >= 200 else 0",
            "land_expr": "",
            "notes": "Allocate built area within mixed-use facility.",
        },
        {
            "category": "Welfare",
            "service": "Day center (frail body)",
            "basis": "age_70_plus",
            "rule_text": "1.8% of 70+",
            "required_expr": "1 if (age_70_plus * 0.018) > 0 else 0",
            "built_expr": "550 if (age_70_plus * 0.018) > 0 else 0",
            "land_expr": "",
            "notes": "Small center baseline.",
        },
        {
            "category": "Welfare",
            "service": "Welfare office (branch)",
            "basis": "total",
            "rule_text": "One branch per 30k-50k residents; ~320 sqm built",
            "required_expr": "ceil_div(total, 50000)",
            "built_expr": "ceil_div(total, 50000) * 320",
            "land_expr": "",
            "notes": "Conservative threshold at 50,000 residents.",
        },
        {
            "category": "Emergency",
            "service": "MDA station",
            "basis": "total",
            "rule_text": "<=15k small; 15k-50k medium; >50k large",
            "required_expr": "1",
            "built_expr": "200 if total <= 15000 else (350 if total <= 50000 else 600)",
            "land_expr": "1 if total <= 15000 else (1.5 if total <= 50000 else 2.5)",
            "notes": "Population-threshold based size.",
        },
        {
            "category": "Emergency",
            "service": "Fire station",
            "basis": "total",
            "rule_text": "Entry threshold: 30,000 residents",
            "required_expr": "1 if total >= 30000 else 0",
            "built_expr": "0",
            "land_expr": "0",
            "notes": "Below threshold returns 0.",
        },
        {
            "category": "Sports",
            "service": "Football field",
            "basis": "total",
            "rule_text": "1 field per 20,000 residents; land 10-12 dunam",
            "required_expr": "ceil_div(total, 20000)",
            "built_expr": "0",
            "land_expr": "ceil_div(total, 20000) * 11",
            "notes": "Midpoint land value (11 dunam).",
        },
        {
            "category": "Sports",
            "service": "Swimming pool (covered)",
            "basis": "total",
            "rule_text": "1 pool per 25,000 residents; built 1,000 sqm; land 2-6 dunam",
            "required_expr": "ceil_div(total, 25000)",
            "built_expr": "ceil_div(total, 25000) * 1000",
            "land_expr": "ceil_div(total, 25000) * 4",
            "notes": "Midpoint land value (4 dunam).",
        },
        {
            "category": "Open Space",
            "service": "Open space - Doorstep",
            "basis": "total",
            "rule_text": "5 sqm per resident; >=80% green",
            "required_expr": "total * 5",
            "built_expr": "",
            "land_expr": "(total * 5) / 1000",
            "notes": "Doorstep open space standard.",
        },
        {
            "category": "Citywide",
            "service": "Citywide services (misc. basket)",
            "basis": "total + housing_units",
            "rule_text": "500-5,000 units: 0.3 sqm per resident",
            "required_expr": "total * 0.3 if housing_units >= 500 and housing_units <= 5000 else 0",
            "built_expr": "",
            "land_expr": "(total * 0.3 if housing_units >= 500 and housing_units <= 5000 else 0) / 1000",
            "notes": "Plan housing-unit size based allocation.",
        },
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# Persistence – SQLite metadata + per-version JSON files
# ─────────────────────────────────────────────────────────────────────────────

DATA_DIR = Path("simulations_data")
DB_PATH = DATA_DIR / "simulations.db"


def init_db():
    DATA_DIR.mkdir(exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS simulations (
            id            TEXT    NOT NULL,
            version       INTEGER NOT NULL,
            name          TEXT,
            area_label    TEXT,
            scenario_type TEXT,
            status        TEXT,
            owner         TEXT,
            created_at    TEXT,
            updated_at    TEXT,
            json_path     TEXT,
            PRIMARY KEY (id, version)
        )
    """)
    con.commit()
    con.close()


def _json_path(sim_id: str, version: int, name: str = "") -> Path:
    safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in name).strip().replace(" ", "_")
    prefix = f"{safe_name}_{sim_id}" if safe_name else sim_id
    return DATA_DIR / f"{prefix}_v{version}.json"


def persist_scenario(s: Dict):
    """Write a JSON snapshot for the current version and upsert metadata in SQLite."""
    DATA_DIR.mkdir(exist_ok=True)
    path = _json_path(s["id"], s["version"], s.get("name", ""))
    path.write_text(
        json.dumps(s, ensure_ascii=False, indent=2, default=str), encoding="utf-8"
    )
    con = sqlite3.connect(DB_PATH)
    con.execute(
        """INSERT OR REPLACE INTO simulations
               (id, version, name, area_label, scenario_type, status, owner,
                created_at, updated_at, json_path)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (
            s["id"], s["version"], s["name"], s.get("area_label", ""),
            s["scenario_type"], s["status"], s.get("owner", ""),
            s["created_at"], s["updated_at"], str(path),
        ),
    )
    con.commit()
    con.close()


def delete_scenario_from_db(sim_id: str):
    con = sqlite3.connect(DB_PATH)
    con.execute("DELETE FROM simulations WHERE id = ?", (sim_id,))
    con.commit()
    con.close()


def load_all_from_db() -> Dict[str, Dict]:
    """Return {id: scenario_dict} for the latest version of every simulation."""
    if not DB_PATH.exists():
        return {}
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        """SELECT id, json_path FROM simulations AS s1
           WHERE version = (
               SELECT MAX(version) FROM simulations AS s2 WHERE s2.id = s1.id
           )"""
    ).fetchall()
    con.close()
    result = {}
    for sim_id, jp in rows:
        try:
            p = Path(jp)
            if p.exists():
                result[sim_id] = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass
    return result


def version_count_for(sim_id: str) -> int:
    """Return total number of saved JSON versions for a simulation."""
    if not DB_PATH.exists():
        return 0
    con = sqlite3.connect(DB_PATH)
    row = con.execute(
        "SELECT COUNT(*) FROM simulations WHERE id = ?", (sim_id,)
    ).fetchone()
    con.close()
    return row[0] if row else 0


# ─────────────────────────────────────────────────────────────────────────────
# File loaders – population histogram & rules
# ─────────────────────────────────────────────────────────────────────────────

def load_population_from_histogram(source) -> Dict:
    """Derive cohort dict from an age-histogram JSON (ages 0–120).

    source: file path (str / Path) or raw bytes.
    JSON format:
        { "histogram": {"0": n, "1": n, ..., "120": n}, "globals": {...} }
    Returns a population dict ready to assign to scenario["population"].
    """
    if isinstance(source, (str, Path)):
        with open(source, encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = json.loads(source.decode("utf-8") if isinstance(source, bytes) else source)

    hist = data.get("histogram", {})

    def age_sum(from_age: int, to_age_excl: int) -> int:
        return sum(int(hist.get(str(a), 0)) for a in range(from_age, to_age_excl))

    population = {
        "total":      age_sum(0, 121),
        "age_0_1":    age_sum(0, 1),
        "age_0_3":    age_sum(0, 3),
        "age_1_6":    age_sum(1, 6),
        "age_0_6":    age_sum(0, 6),
        "age_3_6":    age_sum(3, 6),
        "age_6_12":   age_sum(6, 12),
        "age_12_18":  age_sum(12, 18),
        "age_70_plus": age_sum(70, 121),
    }
    globals_ = data.get("globals", {"housing_units": 4500, "settlement_type": "B"})
    return {"population": population, "globals": globals_}


def load_rules_from_file(source) -> Dict:
    """Load a rules JSON from a file path or raw bytes."""
    if isinstance(source, (str, Path)):
        with open(source, encoding="utf-8") as f:
            return json.load(f)
    return json.loads(source.decode("utf-8") if isinstance(source, bytes) else source)


SCENARIO_TYPES = ["local_program", "regional_program", "plan_delta_program"]
STATUS_OPTIONS = ["draft", "in_review", "approved", "archived"]
SETTLEMENT_TYPES = ["A", "B", "C"]

CATEGORY_COLORS = {
    "Education": "#4E9AF1",
    "Health": "#5ECFB1",
    "Culture & Community": "#F7B731",
    "Welfare": "#FF8C69",
    "Emergency": "#E55353",
    "Sports": "#A29BFE",
    "Open Space": "#55EFC4",
    "Citywide": "#FDCB6E",
}

# ─────────────────────────────────────────────────────────────────────────────
# Calculation engine
# ─────────────────────────────────────────────────────────────────────────────

def ceil_div(a: float, b: float) -> int:
    if b == 0:
        return 0
    return int(math.ceil(a / b))


def safe_eval_expr(expr: str, ctx: Dict[str, Any]) -> float:
    allowed_funcs = {"min": min, "max": max, "ceil_div": ceil_div}
    env = {"__builtins__": {}}
    env.update(allowed_funcs)
    env.update(ctx)
    return float(eval(expr, env, {}))


def _to_number(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        x = x.strip().replace(",", "")
        return float(x) if x else 0.0
    return float(x)


def build_context(pop_json: Dict[str, Any]) -> Dict[str, Any]:
    ctx = {}
    pop = pop_json.get("population", pop_json)
    if isinstance(pop, dict):
        for k, v in pop.items():
            if isinstance(v, (int, float, str)) and k.isidentifier():
                ctx[k] = _to_number(v)
    g = pop_json.get("globals", {})
    if isinstance(g, dict):
        for k, v in g.items():
            if isinstance(v, (int, float, str)) and k.isidentifier():
                ctx[k] = v if isinstance(v, str) else _to_number(v)
    return ctx


def run_rules(pop_json: Dict[str, Any], rules_json: Dict[str, Any]) -> pd.DataFrame:
    ctx = build_context(pop_json)
    out = []
    for r in rules_json.get("rules", []):
        if not isinstance(r, dict):
            continue
        category = str(r.get("category", ""))
        service = str(r.get("service", ""))
        basis = str(r.get("basis", ""))
        rule_text = str(r.get("rule_text", ""))
        required_expr = r.get("required_expr", "")
        built_expr = r.get("built_expr", None)
        land_expr = r.get("land_expr", None)
        notes = str(r.get("notes", ""))

        required_units: Union[int, float, str] = ""
        built_sqm: Optional[float] = None
        land_dunam: Optional[float] = None

        try:
            if isinstance(required_expr, str) and required_expr.strip():
                rv = safe_eval_expr(required_expr, ctx)
                required_units = int(round(rv)) if abs(rv - round(rv)) < 1e-9 else rv
            if isinstance(built_expr, str) and built_expr.strip():
                built_sqm = safe_eval_expr(built_expr, ctx)
            if isinstance(land_expr, str) and land_expr.strip():
                land_dunam = safe_eval_expr(land_expr, ctx)
        except Exception as e:
            required_units = "ERROR"
            notes = f"{notes} | Rule error: {type(e).__name__}: {e}"

        out.append({
            "category": category,
            "service": service,
            "basis": basis,
            "rule": rule_text,
            "required_units": required_units,
            "built_sqm": built_sqm,
            "land_dunam": land_dunam,
            "notes": notes,
        })
    return pd.DataFrame(out)


# ─────────────────────────────────────────────────────────────────────────────
# Scenario data model
# ─────────────────────────────────────────────────────────────────────────────

def new_scenario(name: str = "New Simulation", scenario_type: str = "local_program") -> Dict:
    now = datetime.now().isoformat(timespec="seconds")
    return {
        "id": str(uuid.uuid4())[:8],
        "name": name,
        "area_label": "",
        "scenario_type": scenario_type,
        "status": "draft",
        "owner": "analyst",
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "versions": [],  # history
        "population": copy.deepcopy(DEFAULT_POPULATION),
        "rules": copy.deepcopy(DEFAULT_RULES),
        "results": None,
        "comments": [],
    }


def save_version(scenario: Dict) -> Dict:
    """Push current state into version history, bump version, and persist to disk."""
    snap = {
        "version": scenario["version"],
        "saved_at": datetime.now().isoformat(timespec="seconds"),
        "population": copy.deepcopy(scenario["population"]),
        "rules": copy.deepcopy(scenario["rules"]),
        "results": copy.deepcopy(scenario.get("results")),
    }
    scenario["versions"].append(snap)
    scenario["version"] += 1
    scenario["updated_at"] = datetime.now().isoformat(timespec="seconds")
    persist_scenario(scenario)
    return scenario


def duplicate_scenario(scenario: Dict) -> Dict:
    new_s = copy.deepcopy(scenario)
    new_s["id"] = str(uuid.uuid4())[:8]
    new_s["name"] = f"{scenario['name']} (copy)"
    new_s["created_at"] = datetime.now().isoformat(timespec="seconds")
    new_s["updated_at"] = new_s["created_at"]
    new_s["status"] = "draft"
    new_s["version"] = 1
    new_s["versions"] = []
    new_s["results"] = None
    new_s["comments"] = []
    return new_s


# ─────────────────────────────────────────────────────────────────────────────
# Session state bootstrap
# ─────────────────────────────────────────────────────────────────────────────

def init_state():
    init_db()
    if "scenarios" not in st.session_state:
        loaded = load_all_from_db()
        if not loaded:
            # Seed with a sample scenario on first run
            s = new_scenario("Ramat Aviv G – Scenario B", "local_program")
            s["area_label"] = "Plan Area North"
            s["status"] = "in_review"
            s["owner"] = "moshe"
            persist_scenario(s)
            loaded = {s["id"]: s}
        st.session_state["scenarios"] = loaded
    if "active_id" not in st.session_state:
        st.session_state["active_id"] = None
    if "page" not in st.session_state:
        st.session_state["page"] = "catalog"
    if "workbench_tab" not in st.session_state:
        st.session_state["workbench_tab"] = "assumptions"


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def fmt_num(v, decimals=1):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return "—"
    try:
        f = float(v)
        if f == 0:
            return "—"
        if decimals == 0:
            return f"{int(f):,}"
        return f"{f:,.{decimals}f}"
    except Exception:
        return str(v)


STATUS_BADGE = {
    "draft": ("🔵", "#3498db"),
    "in_review": ("🟡", "#f39c12"),
    "approved": ("🟢", "#27ae60"),
    "archived": ("⚫", "#7f8c8d"),
}


def status_badge(status: str) -> str:
    icon, _ = STATUS_BADGE.get(status, ("⚪", "#bdc3c7"))
    return f"{icon} {status.replace('_', ' ').title()}"


# ─────────────────────────────────────────────────────────────────────────────
# CSS
# ─────────────────────────────────────────────────────────────────────────────

STYLE = """
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

html, body, [class*="css"] {
    font-family: 'IBM Plex Sans', sans-serif;
}

/* Light sidebar */
[data-testid="stSidebar"] {
    background: #f6f8fa !important;
    border-right: 1px solid #d0d7de;
}
[data-testid="stSidebar"] * { color: #24292f !important; }
[data-testid="stSidebar"] .stButton > button {
    background: transparent !important;
    border: 1px solid #d0d7de !important;
    color: #24292f !important;
    font-family: 'IBM Plex Mono', monospace !important;
    font-size: 0.78rem !important;
    width: 100%;
    text-align: left;
    padding: 0.45rem 0.75rem;
    margin-bottom: 2px;
    border-radius: 6px;
    transition: all 0.15s;
}
[data-testid="stSidebar"] .stButton > button:hover {
    background: #ddf4ff !important;
    border-color: #0969da !important;
    color: #0969da !important;
}

/* Top-level metric cards */
.kpi-row { display: flex; gap: 12px; margin-bottom: 20px; }
.kpi-card {
    flex: 1;
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 10px;
    padding: 16px 18px;
}
.kpi-card .label {
    font-size: 0.72rem;
    color: #57606a;
    text-transform: uppercase;
    letter-spacing: .08em;
    font-family: 'IBM Plex Mono', monospace;
}
.kpi-card .value {
    font-size: 1.8rem;
    font-weight: 600;
    color: #1f2328;
    margin-top: 4px;
    font-family: 'IBM Plex Mono', monospace;
}
.kpi-card .sub {
    font-size: 0.72rem;
    color: #57606a;
    margin-top: 2px;
}

/* Scenario card */
.sc-card {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    display: flex;
    align-items: center;
    gap: 16px;
}
.sc-card:hover { border-color: #0969da; background: #ddf4ff; }
.sc-card.active { border-color: #0969da; background: #ddf4ff; }
.sc-card .sc-name {
    font-weight: 600;
    color: #1f2328;
    font-size: 0.95rem;
}
.sc-card .sc-meta {
    font-size: 0.75rem;
    color: #57606a;
    margin-top: 3px;
    font-family: 'IBM Plex Mono', monospace;
}
.sc-card .sc-badge {
    margin-left: auto;
    font-size: 0.72rem;
    color: #57606a;
    white-space: nowrap;
}

/* Section header */
.sec-header {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    color: #57606a;
    text-transform: uppercase;
    letter-spacing: .1em;
    margin-bottom: 10px;
    margin-top: 4px;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 6px;
}

/* Table tweaks */
.result-table th {
    background: #f6f8fa !important;
    color: #57606a !important;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
}

/* Main background */
.main .block-container { background: #ffffff; padding-top: 1.5rem; }
body { background: #ffffff; }

/* Page title */
.page-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1.3rem;
    font-weight: 600;
    color: #1f2328;
    margin-bottom: 4px;
}
.page-sub {
    font-size: 0.8rem;
    color: #57606a;
    margin-bottom: 20px;
}

/* Workbench tabs */
.tab-bar { display: flex; gap: 6px; margin-bottom: 20px; }
.tab-btn {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    padding: 7px 18px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.78rem;
    color: #57606a;
    cursor: pointer;
}
.tab-btn.active {
    background: #ddf4ff;
    border-color: #0969da;
    color: #0969da;
}

/* Comment chip */
.comment-chip {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
    font-size: 0.8rem;
    color: #24292f;
}
.comment-chip .ts {
    font-size: 0.68rem;
    color: #57606a;
    font-family: 'IBM Plex Mono', monospace;
}

/* Version row */
.ver-row {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    padding: 10px 16px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.78rem;
    color: #24292f;
}

/* Streamlit overrides */
.stSelectbox label, .stNumberInput label, .stTextInput label, .stTextArea label {
    color: #57606a !important;
    font-size: 0.78rem !important;
    font-family: 'IBM Plex Mono', monospace !important;
    text-transform: uppercase;
    letter-spacing: .06em;
}
.stButton > button {
    background: #ddf4ff !important;
    border: 1px solid #0969da !important;
    color: #0969da !important;
    font-family: 'IBM Plex Mono', monospace !important;
    font-size: 0.8rem !important;
    border-radius: 7px !important;
}
.stButton > button:hover {
    background: #0969da !important;
    color: #fff !important;
}
.stButton > button[kind="primary"] {
    background: #0969da !important;
    color: #fff !important;
}
div[data-testid="stMetric"] {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 10px;
    padding: 14px;
}
div[data-testid="stMetric"] label { color: #57606a !important; font-size: 0.72rem !important; }
div[data-testid="stMetric"] [data-testid="stMetricValue"] { color: #1f2328 !important; font-family: 'IBM Plex Mono', monospace !important; }
</style>
"""

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: Catalog
# ─────────────────────────────────────────────────────────────────────────────

def page_catalog():
    st.markdown('<div class="page-title">📋 Simulation Catalog</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-sub">All planning scenarios — create, open, compare, duplicate</div>', unsafe_allow_html=True)

    scenarios = st.session_state["scenarios"]

    # ── toolbar ──────────────────────────────────────────────────────────────
    col_search, col_type, col_status, col_new = st.columns([3, 2, 2, 1.5])
    with col_search:
        search = st.text_input("🔍 Search", placeholder="Name, area, owner…", label_visibility="collapsed")
    with col_type:
        filter_type = st.selectbox("Type", ["All types"] + SCENARIO_TYPES, label_visibility="collapsed")
    with col_status:
        filter_status = st.selectbox("Status", ["All statuses"] + STATUS_OPTIONS, label_visibility="collapsed")
    with col_new:
        if st.button("＋ New Simulation", use_container_width=True):
            s = new_scenario()
            persist_scenario(s)
            st.session_state["scenarios"][s["id"]] = s
            st.session_state["active_id"] = s["id"]
            st.session_state["page"] = "workbench"
            st.rerun()

    st.markdown('<div class="sec-header">Simulations</div>', unsafe_allow_html=True)

    # ── filter ───────────────────────────────────────────────────────────────
    items = list(scenarios.values())
    if search:
        q = search.lower()
        items = [s for s in items if q in s["name"].lower() or q in s.get("area_label", "").lower() or q in s.get("owner", "").lower()]
    if filter_type != "All types":
        items = [s for s in items if s["scenario_type"] == filter_type]
    if filter_status != "All statuses":
        items = [s for s in items if s["status"] == filter_status]

    if not items:
        st.info("No simulations match your filters.")
        return

    # ── header row ───────────────────────────────────────────────────────────
    h1, h2, h3, h4, h5, h6, h7 = st.columns([4, 2.5, 1.5, 1.5, 1.5, 2, 2.5])
    for col, label in zip(
        [h1, h2, h3, h4, h5, h6, h7],
        ["Name / Area", "Type", "v", "Status", "Owner", "Updated", "Actions"],
    ):
        col.markdown(f'<div style="font-size:0.7rem;color:#57606a;font-family:\'IBM Plex Mono\',monospace;text-transform:uppercase;letter-spacing:.06em;padding:2px 0 6px">{label}</div>', unsafe_allow_html=True)

    for s in sorted(items, key=lambda x: x["updated_at"], reverse=True):
        c1, c2, c3, c4, c5, c6, c7 = st.columns([4, 2.5, 1.5, 1.5, 1.5, 2, 2.5])
        with c1:
            st.markdown(f"""
                <div style="font-weight:600;color:#1f2328;font-size:0.88rem">{s['name']}</div>
                <div style="font-size:0.72rem;color:#57606a;font-family:'IBM Plex Mono',monospace">{s.get('area_label','—')}</div>
            """, unsafe_allow_html=True)
        with c2:
            st.markdown(f'<div style="font-size:0.78rem;color:#24292f;font-family:\'IBM Plex Mono\',monospace">{s["scenario_type"]}</div>', unsafe_allow_html=True)
        with c3:
            n_saved = version_count_for(s["id"])
            st.markdown(
                f'<div style="font-size:0.78rem;color:#0969da;font-family:\'IBM Plex Mono\',monospace">'
                f'v{s["version"]}'
                f'<span style="color:#57606a;font-size:0.68rem"> ({n_saved} JSON{"s" if n_saved!=1 else ""})</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
        with c4:
            icon, _ = STATUS_BADGE.get(s["status"], ("⚪", "#bdc3c7"))
            st.markdown(f'<div style="font-size:0.78rem;color:#24292f">{icon} {s["status"].replace("_"," ").title()}</div>', unsafe_allow_html=True)
        with c5:
            st.markdown(f'<div style="font-size:0.78rem;color:#24292f">{s.get("owner","—")}</div>', unsafe_allow_html=True)
        with c6:
            ts = s["updated_at"][:16].replace("T", " ")
            st.markdown(f'<div style="font-size:0.72rem;color:#57606a;font-family:\'IBM Plex Mono\',monospace">{ts}</div>', unsafe_allow_html=True)
        with c7:
            bc1, bc2, bc3 = st.columns(3)
            with bc1:
                if st.button("Open", key=f"open_{s['id']}"):
                    st.session_state["active_id"] = s["id"]
                    st.session_state["page"] = "workbench"
                    st.rerun()
            with bc2:
                if st.button("Copy", key=f"dup_{s['id']}"):
                    ns = duplicate_scenario(s)
                    persist_scenario(ns)
                    st.session_state["scenarios"][ns["id"]] = ns
                    st.rerun()
            with bc3:
                if st.button("🗑", key=f"del_{s['id']}"):
                    delete_scenario_from_db(s["id"])
                    del st.session_state["scenarios"][s["id"]]
                    if st.session_state.get("active_id") == s["id"]:
                        st.session_state["active_id"] = None
                    st.rerun()
        st.markdown('<hr style="border:none;border-top:1px solid #d0d7de;margin:4px 0">', unsafe_allow_html=True)

    # ── summary KPIs ─────────────────────────────────────────────────────────
    st.markdown("---")
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Total simulations", len(scenarios))
    k2.metric("Draft", sum(1 for s in scenarios.values() if s["status"] == "draft"))
    k3.metric("In review", sum(1 for s in scenarios.values() if s["status"] == "in_review"))
    k4.metric("Approved", sum(1 for s in scenarios.values() if s["status"] == "approved"))


# ─────────────────────────────────────────────────────────────────────────────
# PAGE: Workbench
# ─────────────────────────────────────────────────────────────────────────────

def page_workbench():
    sid = st.session_state.get("active_id")
    if not sid or sid not in st.session_state["scenarios"]:
        st.warning("No simulation selected. Go back to the catalog.")
        if st.button("← Catalog"):
            st.session_state["page"] = "catalog"
            st.rerun()
        return

    s = st.session_state["scenarios"][sid]

    # ── breadcrumb + title ───────────────────────────────────────────────────
    st.markdown(f'<div style="font-size:0.72rem;color:#57606a;font-family:\'IBM Plex Mono\',monospace;margin-bottom:4px">CATALOG / {s["name"]}</div>', unsafe_allow_html=True)
    col_title, col_status, col_ver = st.columns([5, 2, 1])
    with col_title:
        new_name = st.text_input("Simulation name", value=s["name"], label_visibility="collapsed")
        if new_name != s["name"]:
            s["name"] = new_name
    with col_status:
        new_status = st.selectbox("Status", STATUS_OPTIONS, index=STATUS_OPTIONS.index(s["status"]), label_visibility="collapsed")
        if new_status != s["status"]:
            s["status"] = new_status
            s["updated_at"] = datetime.now().isoformat(timespec="seconds")
    with col_ver:
        st.markdown(f'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:0.9rem;color:#0969da;padding-top:8px">v{s["version"]}</div>', unsafe_allow_html=True)

    # ── tab bar ──────────────────────────────────────────────────────────────
    tabs = ["📐 Assumptions", "📊 Calculator", "💬 Comments & Versions"]
    tab_keys = ["assumptions", "calculator", "comments"]
    cur = st.session_state.get("workbench_tab", "assumptions")

    tab_html = '<div class="tab-bar">'
    for t, k in zip(tabs, tab_keys):
        cls = "tab-btn active" if cur == k else "tab-btn"
        tab_html += f'<span class="{cls}">{t}</span>'
    tab_html += "</div>"
    st.markdown(tab_html, unsafe_allow_html=True)

    chosen = st.radio("Tab", tabs, index=tab_keys.index(cur), horizontal=True, label_visibility="collapsed")
    new_tab = tab_keys[tabs.index(chosen)]
    if new_tab != cur:
        st.session_state["workbench_tab"] = new_tab
        st.rerun()

    st.markdown('<hr style="border:none;border-top:1px solid #d0d7de;margin:4px 0 16px">', unsafe_allow_html=True)

    if cur == "assumptions":
        tab_assumptions(s)
    elif cur == "calculator":
        tab_calculator(s)
    else:
        tab_comments(s)


# ── Tab: Assumptions ─────────────────────────────────────────────────────────

def tab_assumptions(s: Dict):
    pop = s["population"]

    # ── Import from file ──────────────────────────────────────────────────────
    with st.expander("📂 Import from file"):
        ic1, ic2 = st.columns(2)
        with ic1:
            st.markdown('<div class="sec-header">Population histogram JSON</div>', unsafe_allow_html=True)
            st.caption("Format: {\"histogram\": {\"0\": n, ..., \"120\": n}, \"globals\": {...}}")
            up_pop = st.file_uploader("Upload population.json", type=["json"], key=f"up_pop_{s['id']}")
            if up_pop:
                try:
                    loaded_pop = load_population_from_histogram(up_pop.read())
                    s["population"] = loaded_pop
                    st.session_state["scenarios"][s["id"]] = s
                    st.success("Population loaded ✓")
                    st.rerun()
                except Exception as e:
                    st.error(f"Load failed: {e}")
            if Path("population.json").exists():
                if st.button("↓ Load from population.json", key=f"load_pop_default_{s['id']}"):
                    s["population"] = load_population_from_histogram("population.json")
                    st.session_state["scenarios"][s["id"]] = s
                    st.rerun()
        with ic2:
            st.markdown('<div class="sec-header">Rules JSON</div>', unsafe_allow_html=True)
            st.caption("Format: {\"rules\": [{\"category\": ..., \"required_expr\": ...}, ...]}")
            up_rules = st.file_uploader("Upload rules.json", type=["json"], key=f"up_rules_{s['id']}")
            if up_rules:
                try:
                    loaded_rules = load_rules_from_file(up_rules.read())
                    s["rules"] = loaded_rules
                    st.session_state["scenarios"][s["id"]] = s
                    st.success("Rules loaded ✓")
                    st.rerun()
                except Exception as e:
                    st.error(f"Load failed: {e}")
            if Path("rules.json").exists():
                if st.button("↓ Load from rules.json", key=f"load_rules_default_{s['id']}"):
                    s["rules"] = load_rules_from_file("rules.json")
                    st.session_state["scenarios"][s["id"]] = s
                    st.rerun()

    st.markdown('<div class="sec-header">Plan Metadata</div>', unsafe_allow_html=True)
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        s["area_label"] = st.text_input("Area / Plan label", value=s.get("area_label", ""))
    with m2:
        idx = SCENARIO_TYPES.index(s["scenario_type"]) if s["scenario_type"] in SCENARIO_TYPES else 0
        s["scenario_type"] = st.selectbox("Scenario type", SCENARIO_TYPES, index=idx)
    with m3:
        s["owner"] = st.text_input("Owner / analyst", value=s.get("owner", ""))
    with m4:
        st.text_input("Created", value=s["created_at"][:16].replace("T", " "), disabled=True)

    st.markdown('<div class="sec-header">Global Assumptions</div>', unsafe_allow_html=True)
    g = pop.get("globals", {})
    ga, gb, gc = st.columns(3)
    with ga:
        g["housing_units"] = st.number_input("Housing units", value=int(g.get("housing_units", 4500)), step=50)
    with gb:
        st_idx = SETTLEMENT_TYPES.index(g.get("settlement_type", "B")) if g.get("settlement_type", "B") in SETTLEMENT_TYPES else 1
        g["settlement_type"] = st.selectbox("Settlement type (A/B/C)", SETTLEMENT_TYPES, index=st_idx)
    with gc:
        st.metric("Household size (calc)", f"{pop['population'].get('total', 0) / max(g['housing_units'], 1):.2f}")
    pop["globals"] = g

    st.markdown('<div class="sec-header">Population Cohorts</div>', unsafe_allow_html=True)
    p = pop["population"]
    cohort_fields = [
        ("total", "Total population"),
        ("age_0_1", "Age 0–1"),
        ("age_0_3", "Age 0–3"),
        ("age_1_6", "Age 1–6"),
        ("age_0_6", "Age 0–6"),
        ("age_3_6", "Age 3–6"),
        ("age_6_12", "Age 6–12"),
        ("age_12_18", "Age 12–18"),
        ("age_70_plus", "Age 70+"),
    ]
    cols_per_row = 4
    rows = [cohort_fields[i:i+cols_per_row] for i in range(0, len(cohort_fields), cols_per_row)]
    for row in rows:
        cols = st.columns(len(row))
        for col, (key, label) in zip(cols, row):
            with col:
                p[key] = st.number_input(label, value=int(p.get(key, 0)), step=10, key=f"cohort_{key}")
    pop["population"] = p
    s["population"] = pop

    st.markdown('<div class="sec-header">Rules JSON (Advanced)</div>', unsafe_allow_html=True)
    rules_text = st.text_area("Rules JSON", value=json.dumps(s["rules"], ensure_ascii=False, indent=2), height=200)
    try:
        parsed_rules = json.loads(rules_text)
        s["rules"] = parsed_rules
        st.success("Rules JSON is valid ✓")
    except json.JSONDecodeError as e:
        st.error(f"Rules JSON error: {e}")

    st.session_state["scenarios"][s["id"]] = s


# ── Tab: Calculator ───────────────────────────────────────────────────────────

def tab_calculator(s: Dict):
    col_run, col_save, col_export = st.columns([2, 2, 2])
    with col_run:
        run_clicked = st.button("▶ Run Simulation", type="primary", use_container_width=True)
    with col_save:
        save_clicked = st.button("💾 Save as New Version", use_container_width=True)
    with col_export:
        export_clicked = st.button("⬇ Export CSV", use_container_width=True)

    if run_clicked:
        try:
            df = run_rules(s["population"], s["rules"])
            s["results"] = df.to_dict("records")
            s["updated_at"] = datetime.now().isoformat(timespec="seconds")
            st.session_state["scenarios"][s["id"]] = s
            st.success("Simulation complete.")
        except Exception as e:
            st.error(f"Simulation failed: {e}")
            return

    if save_clicked:
        st.session_state["scenarios"][s["id"]] = save_version(s)
        st.success(f"Saved as v{s['version']}.")

    if not s.get("results"):
        st.info("Click **▶ Run Simulation** to compute results.")
        return

    df = pd.DataFrame(s["results"])

    # KPIs
    total_built = pd.to_numeric(df["built_sqm"], errors="coerce").fillna(0).sum()
    total_land = pd.to_numeric(df["land_dunam"], errors="coerce").fillna(0).sum()
    n_services = len(df)
    n_cats = df["category"].nunique()

    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Services calculated", n_services)
    k2.metric("Categories", n_cats)
    k3.metric("Total built area (m²)", f"{int(total_built):,}")
    k4.metric("Total land (dunam)", f"{total_land:.1f}")

    st.markdown("---")

    # Category sections
    categories = df["category"].unique().tolist()
    for cat in categories:
        cat_df = df[df["category"] == cat].copy()
        color = CATEGORY_COLORS.get(cat, "#888")
        cat_built = pd.to_numeric(cat_df["built_sqm"], errors="coerce").fillna(0).sum()
        cat_land = pd.to_numeric(cat_df["land_dunam"], errors="coerce").fillna(0).sum()

        st.markdown(
            f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
            f'<div style="width:10px;height:10px;background:{color};border-radius:50%"></div>'
            f'<span style="font-weight:600;color:#1f2328;font-size:0.88rem">{cat}</span>'
            f'<span style="margin-left:auto;font-family:\'IBM Plex Mono\',monospace;font-size:0.72rem;color:#57606a">'
            f'Built: {int(cat_built):,} m² &nbsp;|&nbsp; Land: {cat_land:.1f} dunam</span>'
            f'</div>',
            unsafe_allow_html=True,
        )

        display_df = cat_df[["service", "required_units", "built_sqm", "land_dunam", "rule"]].copy()
        display_df.columns = ["Service", "Required units", "Built (m²)", "Land (dunam)", "Rule"]
        display_df["Built (m²)"] = display_df["Built (m²)"].apply(lambda v: fmt_num(v, 0))
        display_df["Land (dunam)"] = display_df["Land (dunam)"].apply(lambda v: fmt_num(v, 1))
        st.dataframe(display_df, use_container_width=True, hide_index=True)
        st.markdown('<div style="margin-bottom:12px"></div>', unsafe_allow_html=True)

    # Land use pie chart
    st.markdown('<div class="sec-header">Land Use by Category</div>', unsafe_allow_html=True)
    pie_df = df.copy()
    pie_df["land_num"] = pd.to_numeric(pie_df["land_dunam"], errors="coerce").fillna(0)
    pie_df = pie_df.groupby("category", as_index=False)["land_num"].sum()
    pie_df = pie_df[pie_df["land_num"] > 0]
    if not pie_df.empty:
        st.vega_lite_chart(
            pie_df,
            {
                "mark": {"type": "arc", "innerRadius": 50, "outerRadius": 120},
                "encoding": {
                    "theta": {"field": "land_num", "type": "quantitative"},
                    "color": {
                        "field": "category",
                        "type": "nominal",
                        "scale": {
                            "domain": list(CATEGORY_COLORS.keys()),
                            "range": list(CATEGORY_COLORS.values()),
                        },
                    },
                    "tooltip": [
                        {"field": "category", "type": "nominal", "title": "Category"},
                        {"field": "land_num", "type": "quantitative", "title": "Land (dunam)", "format": ".1f"},
                    ],
                },
            },
            use_container_width=True,
        )

    # Export
    if export_clicked and s.get("results"):
        csv = df.to_csv(index=False).encode("utf-8-sig")
        st.download_button("Download CSV now", data=csv, file_name=f"{s['name']}_v{s['version']}.csv", mime="text/csv")


# ── Tab: Comments & Versions ──────────────────────────────────────────────────

def tab_comments(s: Dict):
    col_left, col_right = st.columns([1, 1])

    with col_left:
        st.markdown('<div class="sec-header">Comments</div>', unsafe_allow_html=True)
        for c in s.get("comments", []):
            st.markdown(
                f'<div class="comment-chip"><div class="ts">{c["ts"]} — {c["author"]}</div>{c["text"]}</div>',
                unsafe_allow_html=True,
            )
        with st.form("add_comment_form", clear_on_submit=True):
            author = st.text_input("Your name", value=s.get("owner", ""))
            text = st.text_area("Comment", height=80)
            if st.form_submit_button("Add comment"):
                if text.strip():
                    s.setdefault("comments", []).append({
                        "ts": datetime.now().isoformat(timespec="seconds"),
                        "author": author or "anonymous",
                        "text": text.strip(),
                    })
                    s["updated_at"] = datetime.now().isoformat(timespec="seconds")
                    st.session_state["scenarios"][s["id"]] = s
                    st.rerun()

    with col_right:
        st.markdown('<div class="sec-header">Version History</div>', unsafe_allow_html=True)
        versions = s.get("versions", [])
        if not versions:
            st.info("No saved versions yet. Use **Save as New Version** in the Calculator tab.")
        else:
            for v in reversed(versions):
                pop_total = v["population"].get("population", {}).get("total", "?")
                has_results = "✓" if v.get("results") else "—"
                st.markdown(
                    f'<div class="ver-row">'
                    f'<span style="color:#0969da">v{v["version"]}</span>'
                    f'<span style="color:#57606a">{v["saved_at"][:16].replace("T"," ")}</span>'
                    f'<span>pop: {pop_total:,}</span>'
                    f'<span>results: {has_results}</span>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

            st.markdown('<div class="sec-header" style="margin-top:16px">Restore a version</div>', unsafe_allow_html=True)
            ver_nums = [v["version"] for v in versions]
            restore_ver = st.selectbox("Restore version", ver_nums, index=len(ver_nums)-1)
            if st.button("⟳ Restore selected version"):
                snap = next(v for v in versions if v["version"] == restore_ver)
                s["population"] = copy.deepcopy(snap["population"])
                s["rules"] = copy.deepcopy(s["rules"])  # keep current rules unless snapshotted
                s["results"] = copy.deepcopy(snap.get("results"))
                st.session_state["scenarios"][s["id"]] = save_version(s)
                st.success(f"Restored from v{restore_ver} and saved as v{s['version']}.")
                st.rerun()

    st.markdown("---")
    st.markdown('<div class="sec-header">Export Simulation Package (JSON)</div>', unsafe_allow_html=True)
    if st.button("⬇ Download JSON package"):
        pkg = json.dumps(s, ensure_ascii=False, indent=2, default=str)
        st.download_button("Download JSON", data=pkg.encode(), file_name=f"{s['name']}_v{s['version']}.json", mime="application/json")


# ─────────────────────────────────────────────────────────────────────────────
# Sidebar
# ─────────────────────────────────────────────────────────────────────────────

def render_sidebar():
    with st.sidebar:
        st.markdown(
            '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:1.1rem;font-weight:600;color:#1f2328;padding:10px 0 4px">PROGRAMA</div>'
            '<div style="font-size:0.68rem;color:#57606a;font-family:\'IBM Plex Mono\',monospace;margin-bottom:20px">Urban Planning Workbench</div>',
            unsafe_allow_html=True,
        )

        if st.button("📋  Catalog", key="nav_catalog"):
            st.session_state["page"] = "catalog"
            st.session_state["active_id"] = None
            st.rerun()

        scenarios = st.session_state.get("scenarios", {})
        if scenarios:
            st.markdown(
                '<div style="font-size:0.65rem;color:#57606a;text-transform:uppercase;letter-spacing:.08em;font-family:\'IBM Plex Mono\',monospace;margin:16px 0 6px;padding-left:4px">Recent simulations</div>',
                unsafe_allow_html=True,
            )
            for s in sorted(scenarios.values(), key=lambda x: x["updated_at"], reverse=True)[:8]:
                icon, _ = STATUS_BADGE.get(s["status"], ("⚪", "#bdc3c7"))
                label = f"{icon}  {s['name'][:22]}{'…' if len(s['name'])>22 else ''}"
                if st.button(label, key=f"sidebar_{s['id']}"):
                    st.session_state["active_id"] = s["id"]
                    st.session_state["page"] = "workbench"
                    st.rerun()

        st.markdown("---")
        if st.button("＋  New Simulation", key="sidebar_new"):
            ns = new_scenario()
            persist_scenario(ns)
            st.session_state["scenarios"][ns["id"]] = ns
            st.session_state["active_id"] = ns["id"]
            st.session_state["page"] = "workbench"
            st.rerun()


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    st.set_page_config(
        page_title="Programa – Urban Planning Workbench",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    st.markdown(STYLE, unsafe_allow_html=True)
    init_state()
    render_sidebar()

    page = st.session_state.get("page", "catalog")
    if page == "catalog":
        page_catalog()
    elif page == "workbench":
        page_workbench()


if __name__ == "__main__":
    main()
