# Programa Calculator v2 — Population Form Spec

## Overview

A web form served by a local FastAPI server that lets a planner enter a number of
new housing units, pick a zone (neighborhood) population profile from the city
dataset, and instantly see the projected new population broken down by age group.

---

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Python 3.13 · FastAPI · Uvicorn     |
| Frontend | Plain HTML5 · Vanilla JavaScript    |
| Data     | `zones_data.json` (local JSON file) |
| Launch   | Windows `.bat` files                |
| No       | Node.js · Angular · React · Vue     |

---

## Project Structure

```
calculator_v_02/
├── api/
│   └── service.py          # FastAPI app
├── zones_data.json          # Neighborhood population profiles
├── rules.json               # Calculation rules catalog
├── rules_extend.json        # Extended rules
├── population_form.html     # The population form (served at /)
├── run_server.bat           # Start the FastAPI server + open browser
└── kill_server.bat          # Kill all processes on the server port
```

---

## Batch Files

### `run_server.bat`
- Sets Python path: `D:\python\Python313\python.exe`
- Runs `uvicorn service:app --reload` from the `api/` directory
- Port: **8001**
- Opens `http://127.0.0.1:8001/` in the default browser after a 2-second delay

### `kill_server.bat`
- Finds and kills any process listening on port **8001** by PID (`netstat`)
- Kills any `python.exe` process with a matching window title
- Run as Administrator if "Access Denied" appears

---

## API Endpoints

| Method | Path         | Description                                      |
|--------|--------------|--------------------------------------------------|
| GET    | `/`          | Serves `population_form.html` as an HTML response|
| GET    | `/api/zones` | Returns the full `zones_data.json` as JSON       |
| GET    | `/api/rules` | Returns the merged rules catalog                 |
| POST   | `/api/calculate` | Runs the rules engine for a given zone       |

---

## Population Form — `population_form.html`

### Inputs

| Field                          | Type    | Validation                        |
|--------------------------------|---------|-----------------------------------|
| יחידות דיור חדשות (New house units) | Integer | Positive whole number, required   |
| בחר פרופיל אוכלוסייה (Zone picker) | Dropdown| Populated from `/api/zones`, required |

- Zone picker shows a live meta-hint on selection:
  `hh_size` · existing housing units · existing total population

### Calculation Logic

```
new_total_population = new_house_units × hh_size   (rounded to integer)

for each age group:
    share = existing_age_group_count / existing_total
    new_age_group_count = round(share × new_total_population)
```

### Age Groups Displayed (non-overlapping)

| Key            | Label  |
|----------------|--------|
| `age_0_3`      | 0–3    |
| `age_3_6`      | 3–6    |
| `age_6_12`     | 6–12   |
| `age_12_18`    | 12–18  |
| `age_18_45`    | 18–45  |
| `age_45_70`    | 45–70  |
| `age_70_plus`  | 70+    |

### Output

- Summary banner: zone name · formula · total new population
- Table: Age group | % of population | New persons | Mini bar chart
- Footer: totals row

---

## Zone Data Schema (`zones_data.json`)

```json
{
  "neighborhoods": [
    {
      "id": "1",
      "name": "גלילות",
      "type": "neighborhood",
      "type_heb": "שכונה",
      "housing_units": 2584,
      "hh_size": 2.5,
      "pop": {
        "total": 6459,
        "age_0_3": 45,
        "age_3_6": 91,
        "age_6_12": 93,
        "age_12_18": 43,
        "age_18_45": 2454,
        "age_45_70": 2958,
        "age_70_plus": 775
      }
    }
  ]
}
```

---

## UI / Theme Requirements

- **Direction**: RTL (Hebrew interface)
- **Color theme: Grayscale only**
  - Backgrounds: white `#ffffff`, light gray `#f0f0f0`, mid gray `#d0d0d0`
  - Text: dark gray `#1a1a1a`, secondary `#555555`
  - Borders: `#cccccc`
  - Buttons: dark gray `#333333` with white text, hover `#555555`
  - Accent / bar fill: `#444444`
  - No blue, no color highlights — strictly grayscale palette
- Clean, minimal card layout centered on page
- Mobile-friendly (single column, max-width 620px)
- No external CSS frameworks or CDN dependencies

---

## Known Issues & Resolutions

| Issue | Cause | Fix |
|-------|-------|-----|
| `{"detail":"Not Found"}` on `/static/...` | `StaticFiles` mount unreliable on this Windows setup | Removed `StaticFiles`; HTML served directly via `HTMLResponse` |
| Zone dropdown showed "error loading data" | `zones_data.json` fetched from static path failed | Added dedicated `/api/zones` endpoint |
| Port 8000 already in use | Previous server session not killed | Switched to port **8001**; added `kill_server.bat` |
| `calculator-test.html` missing | File never existed in project | Replaced broken route with form redirect |
