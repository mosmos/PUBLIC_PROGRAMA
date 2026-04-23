import json
import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import streamlit as st


# --how to run--------------------------------------------
# D:\python\Python313\Scripts\streamlit.exe run .\calculator_1.py
# ---------------------------------------------------------

def _get_path(d: Dict[str, Any], path: str, default=None):
    """
    Simple dotted-path getter: "population.age_3_6" -> value
    """
    cur = d
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return default
    return cur

def _to_number(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        x = x.strip().replace(",", "")
        return float(x) if x else 0.0
    return float(x)

def ceil_div(a: float, b: float) -> int:
    if b == 0:
        return 0
    return int(math.ceil(a / b))

def safe_eval_expr(expr: str, ctx: Dict[str, Any]) -> float:
    """
    Evaluate a simple arithmetic expression using a controlled environment.
    Supports:
      - numbers, + - * / ** ( ) 
      - min(), max(), ceil_div()
      - variable access through ctx via python names:
          total, age_3_6, age_6_12, etc.
    Security note:
      This is NOT a general-purpose sandbox, but it's restricted:
      - no builtins except min/max
      - no attribute access or imports (because __builtins__ is empty)
    """
    allowed_funcs = {
        "min": min,
        "max": max,
        "ceil_div": ceil_div,
        # If you really want math.floor/ceil you can add them explicitly.
    }
    env = {"__builtins__": {}}
    env.update(allowed_funcs)
    env.update(ctx)
    return float(eval(expr, env, {}))  # yes, eval. no, we don't trust humans. that's why env is empty.


# ---------------------------------------------------------
# Rule Engine
# ---------------------------------------------------------

@dataclass
class RuleResult:
    category: str
    service: str
    basis: str
    rule: str
    required_units: Union[int, float, str]
    built_sqm: Optional[float]
    land_dunam: Optional[float]
    notes: str

def build_context(population_json: Dict[str, Any], globals_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Flatten population keys into context variables for expressions.
    Example:
      population: { "total": 12000, "age_3_6": 850 }
      ctx: { "total": 12000, "age_3_6": 850, ... plus globals }
    """
    ctx = {}
    pop = population_json.get("population", population_json)  # allow either wrapped or direct
    if not isinstance(pop, dict):
        pop = {}

    for k, v in pop.items():
        # Only simple scalar values are injected
        if isinstance(v, (int, float, str)) and k.isidentifier():
            ctx[k] = _to_number(v)

    # add globals (e.g., settlement_type, housing_units)
    g = globals_json.get("globals", globals_json)
    if isinstance(g, dict):
        for k, v in g.items():
            if isinstance(v, (int, float, str)) and k.isidentifier():
                # Keep strings too (e.g. settlement_type)
                ctx[k] = v if isinstance(v, str) else _to_number(v)

    return ctx

def run_rules(pop_json: Dict[str, Any], rules_json: Dict[str, Any]) -> pd.DataFrame:
    """
    rules_json schema:
    {
      "globals": {...optional defaults...},
      "rules": [
        {
          "category": "Education",
          "service": "Kindergarten (3-6)",
          "basis": "age_3_6",
          "rule_text": "100% / 30 kids per class",
          "required_expr": "ceil_div(age_3_6, 30)",
          "built_expr": "ceil_div(age_3_6, 30) * 130",
          "land_expr": "ceil_div(age_3_6, 30) * 0.5",
          "notes": "Some notes"
        }
      ]
    }
    """
    # merge globals from pop_json over rules_json (pop_json takes precedence)
    globals_from_rules = rules_json.get("globals", {})
    globals_from_pop = pop_json.get("globals", {})
    merged_globals = {}
    if isinstance(globals_from_rules, dict):
        merged_globals.update(globals_from_rules)
    if isinstance(globals_from_pop, dict):
        merged_globals.update(globals_from_pop)

    ctx = build_context(pop_json, {"globals": merged_globals})

    out: List[RuleResult] = []
    rules = rules_json.get("rules", [])
    if not isinstance(rules, list):
        raise ValueError("rules_json['rules'] must be a list")

    for r in rules:
        if not isinstance(r, dict):
            continue

        category = str(r.get("category", ""))
        service = str(r.get("service", ""))
        basis = str(r.get("basis", ""))  # informational only
        rule_text = str(r.get("rule_text", ""))

        required_expr = r.get("required_expr", "")
        built_expr = r.get("built_expr", None)
        land_expr = r.get("land_expr", None)

        notes = str(r.get("notes", ""))

        # Evaluate
        required_units: Union[int, float, str]
        built_sqm: Optional[float] = None
        land_dunam: Optional[float] = None

        try:
            if isinstance(required_expr, str) and required_expr.strip():
                required_val = safe_eval_expr(required_expr, ctx)
                # If user wants int-like, they can wrap with ceil_div / int() not allowed; keep numeric
                # Heuristic: if it's very close to integer, show as int
                required_units = int(round(required_val)) if abs(required_val - round(required_val)) < 1e-9 else required_val
            else:
                required_units = ""

            if isinstance(built_expr, str) and built_expr.strip():
                built_sqm = safe_eval_expr(built_expr, ctx)
            if isinstance(land_expr, str) and land_expr.strip():
                land_dunam = safe_eval_expr(land_expr, ctx)

            # Optional post-processing / thresholds
            # Example:
            # if r.get("min_threshold") is not None and required_units < r["min_threshold"]:
            #     notes += " Below threshold."

        except Exception as e:
            # The rule failed; capture error in notes instead of crashing the whole run.
            # Because planners deserve outputs, even when JSON is trying to hurt you.
            required_units = "ERROR"
            notes = (notes + " | " if notes else "") + f"Rule evaluation error: {type(e).__name__}: {e}"

        out.append(RuleResult(
            category=category,
            service=service,
            basis=basis,
            rule=rule_text,
            required_units=required_units,
            built_sqm=built_sqm,
            land_dunam=land_dunam,
            notes=notes
        ))

    df = pd.DataFrame([r.__dict__ for r in out])
    # Nice ordering
    cols = ["category", "service", "basis", "rule", "required_units", "built_sqm", "land_dunam", "notes"]
    df = df[cols]
    return df
def load_json_file(path: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return fallback

# ---------------------------------------------------------
# Road Segment Map (dummy data)
# ---------------------------------------------------------

_ROAD_SEGMENTS = [
    {"name": "Highway 1 (E–W)",       "lons": [34.775, 34.783, 34.793, 34.802], "lats": [32.080, 32.080, 32.080, 32.080], "count": 3400},
    {"name": "Main Boulevard (N–S)",  "lons": [34.783, 34.783, 34.783, 34.783], "lats": [32.072, 32.078, 32.084, 32.090], "count": 2100},
    {"name": "South Bypass",          "lons": [34.775, 34.787, 34.800, 34.812], "lats": [32.073, 32.070, 32.069, 32.071], "count": 2800},
    {"name": "Northern Ring Road",    "lons": [34.776, 34.786, 34.796, 34.806], "lats": [32.090, 32.092, 32.092, 32.090], "count": 1450},
    {"name": "Industrial Access Rd",  "lons": [34.800, 34.806, 34.811],         "lats": [32.071, 32.075, 32.078],         "count": 1750},
    {"name": "Eastern Avenue",        "lons": [34.793, 34.799, 34.806],         "lats": [32.073, 32.077, 32.081],         "count": 870},
    {"name": "Cross Street B",        "lons": [34.795, 34.795, 34.795],         "lats": [32.077, 32.081, 32.085],         "count": 680},
    {"name": "Market Street",         "lons": [34.780, 34.786, 34.792],         "lats": [32.077, 32.078, 32.078],         "count": 540},
    {"name": "Park Road",             "lons": [34.790, 34.791, 34.791],         "lats": [32.074, 32.078, 32.082],         "count": 220},
    {"name": "Residential Lane A",    "lons": [34.787, 34.790, 34.794],         "lats": [32.085, 32.086, 32.087],         "count": 150},
]


def _count_to_color(count: float, min_c: float, max_c: float) -> str:
    """Green (low) → yellow (mid) → red (high) hex color."""
    t = (count - min_c) / (max_c - min_c) if max_c > min_c else 0.5
    if t <= 0.5:
        r = int(510 * t)
        g = 200
    else:
        r = 255
        g = int(200 * (1.0 - (t - 0.5) * 2))
    return f"#{r:02x}{g:02x}00"


def _count_to_width(count: float, min_c: float, max_c: float) -> int:
    t = (count - min_c) / (max_c - min_c) if max_c > min_c else 0.5
    return max(2, int(2 + 6 * t))


def render_road_segment_map() -> None:
    try:
        import plotly.graph_objects as go
    except ImportError:
        st.warning("plotly is required for the road map. Run: pip install plotly")
        return

    counts = [s["count"] for s in _ROAD_SEGMENTS]
    min_c, max_c = min(counts), max(counts)

    fig = go.Figure()
    for seg in _ROAD_SEGMENTS:
        color = _count_to_color(seg["count"], min_c, max_c)
        width = _count_to_width(seg["count"], min_c, max_c)
        fig.add_trace(go.Scattermapbox(
            mode="lines",
            lon=seg["lons"],
            lat=seg["lats"],
            line=dict(width=width, color=color),
            name=seg["name"],
            hovertemplate=f"<b>{seg['name']}</b><br>Daily count: {seg['count']:,}<extra></extra>",
        ))

    all_lats = [lat for s in _ROAD_SEGMENTS for lat in s["lats"]]
    all_lons = [lon for s in _ROAD_SEGMENTS for lon in s["lons"]]
    center_lat = (min(all_lats) + max(all_lats)) / 2
    center_lon = (min(all_lons) + max(all_lons)) / 2

    fig.update_layout(
        mapbox=dict(
            style="open-street-map",
            center=dict(lat=center_lat, lon=center_lon),
            zoom=13,
        ),
        margin=dict(l=0, r=0, t=0, b=0),
        height=500,
        showlegend=True,
        legend=dict(title="Road Segments", bgcolor="rgba(255,255,255,0.85)", x=0, y=1),
    )

    st.plotly_chart(fig, use_container_width=True)

    col_low, col_bar, col_high = st.columns([1, 4, 1])
    with col_low:
        st.markdown(f"🟢 **Low** ({min_c:,})")
    with col_bar:
        st.markdown(
            '<div style="height:12px;background:linear-gradient(to right,#00c800,#ffc800,#ff0000);'
            'border-radius:4px;margin-top:6px;"></div>',
            unsafe_allow_html=True,
        )
    with col_high:
        st.markdown(f"🔴 **High** ({max_c:,})")


# ---------------------------------------------------------
# Streamlit GUI
# ---------------------------------------------------------

st.set_page_config(page_title="Public Services Simulator", layout="wide")
st.title("Public Services Simulator for Urban Planners")
st.caption("Input population and rules as JSON, get a table of required services, built area, and land area. Designed for urban planners to quickly test different scenarios and rulesets.")

st.subheader("Road Segment Map")
st.caption("Dummy road segments — color and line width encode daily vehicle count (green = low, red = high).")
render_road_segment_map()

st.divider()

def extract_declared_categories(rules_json: Dict[str, Any]) -> List[str]:
    categories: List[str] = []
    rules = rules_json.get("rules", [])
    if not isinstance(rules, list):
        return categories

    for r in rules:
        if not isinstance(r, dict):
            continue
        category = str(r.get("category", "")).strip() or "(Uncategorized)"
        if category not in categories:
            categories.append(category)
    return categories

if "pop_text" not in st.session_state:
    st.session_state["pop_text"] = json.dumps(load_json_file("population.json", {"population": {}, "globals": {}}), ensure_ascii=False, indent=2)
if "rules_text" not in st.session_state:
    st.session_state["rules_text"] = json.dumps(load_json_file("rules.json", {"rules": []}), ensure_ascii=False, indent=2)

st.subheader("Simulation Results")
if "df_result" in st.session_state:
    df = st.session_state["df_result"].copy()
    declared_categories = st.session_state.get("declared_categories", [])
    if not declared_categories:
        declared_categories = df["category"].fillna("").astype(str).replace("", "(Uncategorized)").unique().tolist()

    st.success("Done.")
    st.dataframe(df, use_container_width=True)

    st.markdown("#### Detailed Table Per Category")
    df_for_display = df.copy()
    df_for_display["category"] = df_for_display["category"].fillna("").astype(str).replace("", "(Uncategorized)")
    for category in declared_categories:
        category_label = category if category.strip() else "(Uncategorized)"
        category_df = df_for_display[df_for_display["category"] == category].reset_index(drop=True)
        st.markdown(f"**{category_label}**")
        if category_df.empty:
            st.info("No rules/results found for this category in the current run.")
        else:
            st.dataframe(category_df, use_container_width=True)

    pie_df = df_for_display.copy()
    pie_df["land_dunam_num"] = pd.to_numeric(pie_df["land_dunam"], errors="coerce").fillna(0)
    pie_df = pie_df.groupby("category", as_index=False)["land_dunam_num"].sum()
    if declared_categories:
        pie_df = pd.DataFrame({"category": declared_categories}).merge(pie_df, on="category", how="left")
        pie_df["land_dunam_num"] = pie_df["land_dunam_num"].fillna(0)
    pie_df_non_zero = pie_df[pie_df["land_dunam_num"] > 0]

    st.markdown("#### Needed Land Use Area by Category (Dunam)")
    if pie_df_non_zero.empty:
        st.info("No positive `land_dunam` values found, so pie chart is not available.")
    else:
        st.vega_lite_chart(
            pie_df_non_zero,
            {
                "mark": {"type": "arc", "innerRadius": 40},
                "encoding": {
                    "theta": {"field": "land_dunam_num", "type": "quantitative"},
                    "color": {"field": "category", "type": "nominal"},
                    "tooltip": [
                        {"field": "category", "type": "nominal"},
                        {"field": "land_dunam_num", "type": "quantitative", "title": "Land (dunam)"},
                    ],
                },
            },
            use_container_width=True,
        )

    csv = df.to_csv(index=False).encode("utf-8-sig")
    st.download_button("Download CSV", data=csv, file_name="simulation_results.csv", mime="text/csv")
else:
    st.info("Run simulation to see the output table, per-category details, and pie chart.")

st.divider()
st.subheader("Inputs (JSON)")
left, right = st.columns(2)

with left:
    st.text_area(
        "Population JSON",
        key="pop_text",
        height=380
    )

with right:
    st.text_area(
        "Rules JSON",
        key="rules_text",
        height=380
    )

run = st.button("Run simulation", type="primary")

if run:
    try:
        pop_json = json.loads(st.session_state["pop_text"])
    except json.JSONDecodeError as e:
        st.error(f"Population JSON parse error: {e}")
        st.stop()

    try:
        rules_json = json.loads(st.session_state["rules_text"])
    except json.JSONDecodeError as e:
        st.error(f"Rules JSON parse error: {e}")
        st.stop()

    try:
        df = run_rules(pop_json, rules_json)
    except Exception as e:
        st.error(f"Simulation failed: {type(e).__name__}: {e}")
        st.stop()

    st.session_state["df_result"] = df
    st.session_state["declared_categories"] = extract_declared_categories(rules_json)
    st.rerun()

