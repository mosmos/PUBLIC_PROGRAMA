# Programa Wizard — Functional Specification

**Audience:** City planners, program managers, and decision-makers  
**Purpose of this document:** Explain what the application does, screen by screen, in plain language

---

## What Is This Application?

The **Programa Wizard** is a planning tool that helps urban professionals answer one core question:

> *Given a neighborhood and its population, what public services and facilities does it need — and how much space should be allocated for them?*

The tool follows a simple three-step flow:

```
Step 1 → Select a neighborhood or zone
Step 2 → Review and adjust the population data
Step 3 → See the calculated service requirements
```

The whole process takes about two minutes. Results can be used to support planning decisions, budget discussions, or formal program submissions.

---

## The Data Behind the Tool

The application works with two types of data:

### Geographic Zones
The tool contains data for **three types of geographic units**:

| Type | Hebrew | Description |
|------|--------|-------------|
| Neighborhood (שכונה) | שכונה | A named residential neighborhood |
| Census Tract (אזור סטטיסטי) | אזור סטטיסטי | A smaller statistical unit used for detailed analysis |
| Quarter (רובע) | רובע | A larger administrative district made up of several neighborhoods |

Each zone carries the following information:
- **Population** — total residents, broken down by age groups
- **Housing units** — number of apartments/dwellings
- **Household size** — average people per dwelling
- **Built area** — square meters of residential, commercial, public, employment, and parking space
- **Land use** — percentage breakdown of how land is currently used

### Planning Rules
The tool uses a library of **18 planning rules**, each defining what a specific public service requires based on the population. The rules are organized into 8 categories (see Step 3 for details).

---

## Step 1 — Select a Zone

**What the user does:** Browse the full list of zones and select one to analyze.

**What the screen shows:**

- A **search bar** at the top — type any part of a name or code to filter the list instantly
- **Filter buttons** to show only neighborhoods, census tracts, or quarters
- A **data table** listing each zone with:
  - Name and code
  - Geographic quarter (רובע)
  - Number of housing units
  - Dominant land use (e.g. "מגורים 80%")
  - Total population
  - An expand button (▼) for a quick data preview

**Drill-down preview (▼):** Clicking the arrow on any row opens a mini-panel with three tabs:
- **חתך אוכלוסייה** — Population breakdown by age group with visual bars
- **שטחים בנויים** — Built area by use type
- **מדדים עיקריים** — Eight key indicators (population, units, family size, % state-sector, age shares)

**How to continue:** Select a row (it highlights blue) and click the **"המשך לפרופיל אוכלוסייה ←"** button. The selected zone's name and type appear next to the button as confirmation.

---

## Step 2 — Review and Edit the Population Profile

**What the user does:** Review all the data for the selected zone and optionally adjust values before running the calculation.

**Why editing is allowed:** Plans are forward-looking. A planner may want to model a future scenario — for example, a new development that will add young families, or a projected increase in elderly residents. Editing the numbers here does **not** change the source data; it only affects the calculation in Step 3.

**What the screen shows:**

### Population Section — Fully Editable

A list of age groups, each with:
- A **number input field** — click and type to change the value
- A **live bar** that stretches or shrinks in real time as you type
- A **percentage** showing that group's share of the total population

| Age Group | Hebrew Label | Used For |
|-----------|-------------|----------|
| 0–1 | תינוקות 0–1 | Family health station (Tipat Halav) |
| 0–3 | ילדים 0–3 | Daycare classes |
| 3–6 | ילדים 3–6 | Kindergarten classes |
| 1–6 | ילדים 1–6 | Family health station (Tipat Halav) |
| 6–12 | ילדים 6–12 | Elementary school |
| 11–18 | נוער 11–18 | Youth club |
| 12–18 | נוער 12–18 | Secondary school |
| 18–45 | בוגרים 18–45 | General population services |
| 45–70 | מבוגרים 45–70 | General population services |
| 70+ | קשישים 70+ | Senior club, welfare day centers |

Two values are **calculated automatically** and cannot be edited:
- **סה"כ תושבים** — The total population, always the sum of the seven non-overlapping age bands (0–3, 3–6, 6–12, 12–18, 18–45, 45–70, 70+)
- **ילדים 0–6** — Always equals the 0–3 group plus the 3–6 group

If the total after editing differs from the original zone total, a yellow warning appears:
> *"נתונים שונו מהמקור — החישוב ישקף את הערכים המעודכנים"*
> ("Data was changed from the source — the calculation will reflect the updated values")

### Housing Section — Editable

Three fields that also feed into the calculation:
- **יחידות דיור (יח"ד)** — Number of housing units
- **גודל משפחה** — Average household size (persons per unit)
- **% ממלכתי** — Percentage of the population in the state-sector (ממלכתי) school system

### Built Areas Section — Read-only

A visual bar chart showing the existing built area (in square metres) broken down by use type. This is reference information and cannot be changed.

### Land Use Section — Read-only

A stacked colour bar showing the percentage of land allocated to each use type (residential, commercial, institutional, industrial, parking).

**How to continue:** Click **"המשך לחישוב ←"**. The (possibly edited) data is carried forward to Step 3.

---

## Step 3 — Calculation Results

**What the user does:** Review the service requirements that were calculated for the selected zone.

**What the screen shows:**

### Summary Banner

A blue header showing four key totals for the zone:
- Population (from the data entered in Step 2)
- Housing units
- **Total required built area** — the sum of all building space the planning rules say is needed
- **Total required land** — the sum of all land area (in dunams) the rules require

### Results Table — Grouped by Category

Results are organised into **8 service categories**, each with its own colour and icon:

| Category | Icon | Hebrew |
|----------|------|--------|
| Education | 🎓 | חינוך |
| Health | 🏥 | בריאות |
| Culture & Community | 🎭 | תרבות וקהילה |
| Welfare | 🤝 | רווחה |
| Emergency | 🚨 | חירום |
| Sports | ⚽ | ספורט |
| Open Space | 🌳 | שטח פתוח |
| Citywide | 🏙️ | כלל עירוני |

Each category shows a header with the **subtotal** for built area and land within that category.

Inside each category, a table row appears for every service, showing:

| Column | What it means |
|--------|--------------|
| **שירות** | The name of the service or facility |
| **יח' נדרשות** | How many units are required (e.g. number of classrooms, clinics, fields) |
| **שטח בנוי (מ"ר)** | Required building area in square metres |
| **קרקע (דונם)** | Required land area in dunams |

A dash (—) means the rule does not define a requirement for that column.

### Drill-Down Explanation (Click Any Row)

Clicking a row expands a panel that explains exactly how the number was calculated. It shows:

1. **כלל** — The planning rule in plain language (e.g. *"100% participation / 30 kids per class"*)
2. **בסיס חישוב** — The specific population group the rule is based on, with its actual value shown as a badge (e.g. `age_3_6 = 91 (ילדים 3–6)`)
3. **Three calculation cards** — One each for required units, built area, and land:
   - The formula as written in the rules library
   - The same formula with the actual numbers filled in
   - The final result in large type
4. **📝 הערות** — Any professional notes or caveats attached to the rule

Clicking the row again (or pressing ▲) closes the panel.

### Grand Total

A footer bar shows the overall totals for the entire zone:
- Total required built area across all categories (מ"ר)
- Total required land across all categories (דונם)

### Navigation

- **← חזרה לפרופיל** — Go back to Step 2 to adjust the population figures and recalculate
- **בחר אזור אחר** — Return to Step 1 to start with a different zone

---

## Example Walkthrough

**Scenario:** A planner wants to understand what services are needed for the *גלילות* neighborhood.

1. **Step 1** — Search "גלילות", see 6,459 residents and 2,584 housing units. Click the row and press Continue.

2. **Step 2** — The planner knows a new development will add 200 children aged 3–6. They change `ילדים 3–6` from 91 to 291. The total updates to 6,659. The bar for that age group grows visibly. Press Continue.

3. **Step 3** — Under 🎓 **חינוך**, the kindergarten row now shows **10 classes** instead of 4. Clicking that row reveals the calculation: `ceil_div(291, 30) = 10`. The planner can see exactly why the number changed and use this to justify a budget request.

---

## Summary of All Planning Rules

| # | Category | Service | Based On |
|---|----------|---------|----------|
| 1 | Education | Daycare (0–3) — classes | Children aged 0–3; 50% participation, 20 per class; minimum 3 classes |
| 2 | Education | Kindergarten (3–6) — classes | Children aged 3–6; 100% participation, 30 per class |
| 3 | Education | Elementary school | Children aged 6–12; 27 per class |
| 4 | Education | Secondary school | Youth aged 12–18; 27 per class |
| 5 | Health | Family health station (Tipat Halav) | Infants 0–1 (100%) + children 1–6 (20%) |
| 6 | Health | Neighborhood clinic | 1 clinic per zone; 400 m² |
| 7 | Culture & Community | Youth club | Youth 11–18; needs 35% × 300+ to trigger |
| 8 | Culture & Community | Senior club | Residents 70+; needs 15% × 200+ to trigger |
| 9 | Welfare | Day center — frail body | 1.8% of 70+ residents |
| 10 | Welfare | Day center — frail mind | 0.2% of 70+ residents |
| 11 | Welfare | Welfare office branch | 1 per 50,000 residents |
| 12 | Emergency | MDA station | Small (<15k), medium (15–50k), or large (>50k) |
| 13 | Emergency | Police community center | 1 per zone; 100 m² |
| 14 | Emergency | Fire station | Threshold: 30,000+ residents |
| 15 | Sports | Football field | 1 per 20,000 residents; 11 dunams each |
| 16 | Sports | Swimming pool (covered) | 1 per 25,000 residents; 1,000 m²; 4 dunams |
| 17 | Open Space | Doorstep open space | 5 m² per resident; ≥80% green |
| 18 | Citywide | Citywide services basket | 0.3 m² per resident (for zones with 500–5,000 units) |

---

## Simulation Catalog

The **Catalog** (קטלוג סימולציות) is the home screen when saved simulations exist. It lets users manage all their saved work in one place.

### What the catalog shows

Each saved simulation appears as a card displaying:
- **Name** — the user-assigned name
- **Zone** — the neighborhood or area the simulation is based on
- **Version** — how many times it has been saved (increments each save)
- **Last updated** — date and time of the last save
- **Summary KPIs** — required built area (m²), land (dunams), and population — pulled from the last calculation

### Catalog actions

| Button | What it does |
|--------|-------------|
| **פתח תוצאות** (Open Results) | Loads the simulation and jumps directly to Step 3 (results view) |
| **ערוך** (Edit) | Loads the simulation and opens Step 2 so population data can be adjusted before recalculating |
| **שכפל** (Duplicate) | Creates an independent copy named "[original name] (עותק)" — useful for comparing scenarios |
| **🗑** (Delete) | Asks for confirmation, then permanently removes the simulation |

A search bar at the top filters the list by simulation name or zone name in real time.

Clicking **"+ סימולציה חדשה"** (New Simulation) starts a fresh wizard from Step 1.

---

## Saving a Simulation

The save interface appears at the bottom of Step 3 (results screen).

### First save
Clicking **"💾 שמור סימולציה"** opens a name field pre-filled with the zone name. The user can rename it, then click **"שמור"**. The simulation is immediately stored and a green confirmation banner appears with a link to the catalog.

### Saving a new version
If the simulation was previously saved, the button changes to **"💾 שמור גרסה חדשה"**. Each save increments the version number (v1 → v2 → v3…) so the user can track the history of changes.

### Save a copy
Clicking **"שמור עותק"** saves a new independent simulation (not linked to the original) with the same population data and results. The copy starts at version 1 and appears separately in the catalog. Use this to branch off a "what-if" scenario without overwriting the original.

### What is saved
Each simulation stores:
- The full zone data (name, type, quarter, housing units, household size)
- The population values **as edited by the user in Step 2** — not the original zone defaults
- The complete set of calculated results (all 18 services, with required units, built area, and land)
- Timestamps (created and last updated)
- Version number

Simulations are stored in the browser's local storage. They persist across sessions on the same browser and device. They are not shared between users or devices.

---

## The Python Planning Workbench (`programa_calculator.py`)

The project also includes a **Streamlit-based desktop application** (`programa_calculator.py`) that provides a more advanced planning environment. It is separate from the three-step wizard but uses the same underlying calculation rules.

### What it adds beyond the wizard

#### Scenario management (full lifecycle)
- **SQLite database** — all scenarios are stored in a local database (`simulations_data/simulations.db`)
- **JSON snapshots** — every saved version is also written as a JSON file (`simulations_data/*.json`)
- **Full version history** — every save creates a snapshot; users can browse and restore any past version
- **Status workflow** — each scenario carries a status: Draft → In Review → Approved → Archived
- **Owner field** — scenarios are attributed to an analyst name

#### Assumptions tab
- Upload a **population histogram** (a JSON file with one number per year of age, 0–120) — the system derives all cohorts automatically from it
- Upload a **custom rules file** — replace or extend the default 18 rules with a new JSON
- Edit the **settlement type** (A / B / C) — affects built-area calculations for haredi education rules
- Edit all population cohorts with precise numeric controls

#### Calculator tab
- Run the full calculation and see the same category/service breakdown as Step 3 of the wizard
- **Export to CSV** — download the results table as a spreadsheet
- **Expand/collapse all categories** at once
- **KPI summary bar** — shows count of services, categories, total built area, total land

#### What-If Analysis tab
For each population cohort, the user can apply one of three types of change:
- **Percentage change** — e.g. "+20% children aged 3–6"
- **Absolute change** — e.g. "add 500 elderly (70+)"
- **Multiplier** — e.g. "×1.5 for working-age adults"

After running the what-if, a side-by-side comparison shows:
- Original totals vs what-if totals (built area and land)
- Category-level deltas with colour coding (green = more need, red = less)

#### Comments & versions tab
- **Inline comments** — any team member can add a timestamped note to a scenario
- **Version history table** — lists all saved versions with their population totals and whether results exist
- **Restore** — load any past version's population and results back into the current scenario
- **Export JSON** — download the full scenario (all data, all versions, all comments) as a single JSON file

#### Catalog page
- Search across all scenarios (by name, area, or owner)
- Filter by scenario type and status
- Summary KPIs: total scenarios, drafts, in-review, approved
- Open, duplicate, or delete any scenario

### Extended rules (`rules_extend.json`)
A second rules file contains additional, more specialised rules — for example haredi education institutions (boys/girls, elementary/secondary) that activate only when a `haredi_pct` value is set. These rules follow the same expression format as the 18 core rules but reference additional population cohorts and settlement-type conditions.

### Calculation engine (shared logic)
The JavaScript wizard (`calcEngine.js`) is a faithful port of the Python calculation engine. Both implement the same logic:
1. Build a variable context from the population cohorts and housing globals
2. Evaluate each rule's three expressions (`required_expr`, `built_expr`, `land_expr`) using `ceil_div`, `min`, `max`
3. Substitute actual values into the expressions for display in the drill-down panel

**Verification:** All 18 core rules were tested against the Python default population (12,000 residents, 4,500 units). The JavaScript engine produces identical results to the Python engine for every rule.
