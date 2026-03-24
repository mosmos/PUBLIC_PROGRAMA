# Programa – Urban Planning Workbench

A Streamlit prototype for computing public-service requirements (classrooms, clinics, parks, sports facilities…) from a town's population data and a configurable rule set.

Built for urban planners and analysts who need to quickly answer: *"If 12,000 people move here, what public services does the plan need to provide?"*

---

## What it does

1. You describe a **population** — either type in cohort numbers manually or load a full age histogram (ages 0–120) from a JSON file.
2. You load a set of **service rules** — each rule is a simple math expression that maps a population cohort to a number of required units, built area (m²), and land (dunam).
3. You click **Run Simulation** — the engine evaluates every rule and produces a results table broken down by category.
4. You **save versions** of each simulation. Every save writes a JSON snapshot to disk and records metadata in a local SQLite database — so nothing is lost between sessions.

---

## Quick start

```bash
pip install streamlit pandas
streamlit run programa_calculator.py
```

Open **http://localhost:8501** in your browser.

---

## File structure

```
programa_calculator.py   ← the entire app (single file)
population.json          ← demo age histogram (12,000 residents, ages 0–120)
rules.json               ← standard public-service rules
rules_extend.json        ← extended rules (Haredi education, religion, sports halls…)
simulations_data/        ← created automatically on first run
    simulations.db       ← SQLite index of all saved simulations
    {name}_{id}_v{n}.json  ← one JSON snapshot per version save
```

---

## How the app is organised

The app has two pages, navigated from the left sidebar.

### Catalog page
A table listing every saved simulation. From here you can:
- **Open** a simulation to edit it
- **Copy** (duplicate) a simulation as a new draft
- **Delete** a simulation (removes it from the DB; JSON files are kept on disk as archive)
- **Create** a new simulation (starts with default population and rules, immediately saved to disk as v1)

### Workbench page
Opens a single simulation with three tabs.

**Assumptions tab**
- Import population from a histogram JSON file or load `population.json` directly
- Import rules from any rules JSON file or load `rules.json` directly
- Edit plan metadata (name, area label, type, owner)
- Edit global assumptions (housing units, settlement type A/B/C)
- Edit population cohort numbers directly
- Edit the raw rules JSON in a text area (advanced)

**Calculator tab**
- **▶ Run Simulation** — evaluates all rules against the current population
- Results table grouped by category (Education, Health, Welfare, Sports…) showing required units, built area, land
- Summary KPIs and a land-use pie chart
- **💾 Save as New Version** — snapshots the current state, bumps the version counter, writes a new JSON file and updates the SQLite record
- **⬇ Export CSV** — download the results table

**Comments & Versions tab**
- Add timestamped comments to a simulation
- Browse the full version history
- Restore any past version (creates a new version from the restored snapshot)
- Download the full simulation package as a JSON file

---

## Population format

### Option A — manual entry
Edit the cohort numbers directly in the Assumptions tab. The app uses these cohorts:

| Key | Meaning |
|---|---|
| `total` | Total population |
| `age_0_1` | Age 0 (under 1 year) |
| `age_0_3` | Ages 0–2 |
| `age_1_6` | Ages 1–5 |
| `age_0_6` | Ages 0–5 |
| `age_3_6` | Ages 3–5 |
| `age_6_12` | Ages 6–11 |
| `age_12_18` | Ages 12–17 |
| `age_70_plus` | Ages 70 and above |

### Option B — histogram file
Load `population.json` (or any file in the same format). The loader sums the per-year buckets to derive all cohort values automatically.

```json
{
  "histogram": {
    "0": 185,
    "1": 175,
    "2": 170,
    ...
    "120": 0
  },
  "globals": {
    "housing_units": 4500,
    "settlement_type": "B"
  }
}
```

---

## Rules format

Each rule in the `rules` array has these fields:

| Field | Required | Description |
|---|---|---|
| `category` | yes | Display group (Education, Health, Sports…) |
| `service` | yes | Service name shown in results |
| `basis` | yes | Which cohort key the rule is based on (for display only) |
| `rule_text` | yes | Human-readable description of the rule |
| `required_expr` | yes | Python expression → number of required units |
| `built_expr` | no | Python expression → built area in m² |
| `land_expr` | no | Python expression → land area in dunam |
| `notes` | no | Additional planning notes |

### Expressions

Expressions are evaluated against a flat namespace that contains all cohort keys plus globals:

```
total, age_0_1, age_0_3, age_1_6, age_0_6, age_3_6,
age_6_12, age_12_18, age_70_plus,
housing_units, settlement_type
```

Three helper functions are available in expressions:
- `ceil_div(a, b)` — ceiling division (e.g. `ceil_div(age_6_12, 27)` = number of school classes)
- `min(a, b)`
- `max(a, b)`

**Example rules:**

```json
{
  "service": "Kindergarten (3-6) - classes",
  "required_expr": "ceil_div(age_3_6, 30)",
  "built_expr": "ceil_div(age_3_6, 30) * 130",
  "land_expr": "ceil_div(age_3_6, 30) * 0.5"
}
```

```json
{
  "service": "MDA station",
  "required_expr": "1",
  "built_expr": "200 if total <= 15000 else (350 if total <= 50000 else 600)",
  "land_expr": "1 if total <= 15000 else (1.5 if total <= 50000 else 2.5)"
}
```

---

## Simulation persistence

Every simulation is stored in two places:

**SQLite (`simulations.db`)** — one row per `(id, version)`:
```
id, version, name, area_label, scenario_type,
status, owner, created_at, updated_at, json_path
```

**JSON file** — full scenario snapshot including population, rules, results, version history, and comments. Named:
```
{SimulationName}_{id}_v{version}.json
```

On startup the app reads the SQLite index to find the latest version of every simulation, then loads those JSON files into memory. If the database is empty (first run) a sample simulation is created automatically.

Deleting a simulation removes its SQLite rows but leaves the JSON files on disk as an archive.

---

## Settlement types

Rules can branch on `settlement_type` (`"A"`, `"B"`, or `"C"`), which reflects Israeli planning classification:

- **A** — large city
- **B** — medium town (most rules are calibrated for this)
- **C** — small/rural settlement

---

## Extended rules (`rules_extend.json`)

Contains additional rules beyond the standard set, including:
- Haredi boys/girls elementary and secondary schools (class sizes and areas differ from mainstream)
- Special education facilities (daycare, kindergarten, primary, secondary)
- Community centers, religion services (synagogues, mikveh)
- Citywide sports facilities (stadium, athletics track, tennis courts, sports halls)
- Urban and citywide open space standards
- Police station (citywide)

These rules use additional context variables (`haredi_pct`, `special_education_pct`, `traditional_pct`) that must be present in the population globals to activate.

---

## Key design decisions for the rewriter

- **Single-file architecture** — the entire app is in `programa_calculator.py`. Good for a prototype; a production rewrite should split it into `engine.py`, `persistence.py`, `pages/`, etc.
- **`st.session_state` as the working store** — all in-flight edits live in session state. Persistence only happens on explicit user action (New / Save / Copy). There is no auto-save on field change.
- **Safe eval sandbox** — rule expressions are evaluated with `eval()` but with `__builtins__` stripped and only `min`, `max`, `ceil_div` injected. No arbitrary code can run.
- **No user authentication** — this is a local analyst tool, not a multi-user web app.
- **SQLite is metadata only** — the JSON file is the source of truth. SQLite is an index to find files quickly.
