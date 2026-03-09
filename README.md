# Public Services Simulator for Urban Planners

A Streamlit application designed to help urban planners quickly test different scenarios and calculate required public services, built areas, and land use based on population demographics and customizable rules.

## Running the Application

```bash
D:\python\Python313\Scripts\streamlit.exe run .\calculator_1.py
```

The application will start a local server where you can input data and run simulations.

---

## How the Calculation Works

### Overview

The simulator performs calculations in three main steps:

1. **Load Input Data** - Population demographics and calculation rules
2. **Build Calculation Context** - Create variables from population data for expressions
3. **Evaluate Rules** - Apply expressions to calculate required services, built area, and land area

### Step 1: Input Data

The simulator requires two JSON inputs:

#### Population JSON
Contains demographic data about the settlement:
- `population`: Dictionary of demographic variables (e.g., age groups, total population)
- `globals`: Optional global settings that apply to all rules

**Example:**
```json
{
  "population": {
    "total": 12000,
    "age_3_6": 850,
    "age_6_12": 1200,
    "age_12_18": 1100,
    "infants_0_3": 450
  },
  "globals": {
    "settlement_type": "urban",
    "housing_units": 4000
  }
}
```

#### Rules JSON
Defines how to calculate service requirements:
- `globals`: Default values that can be overridden by population JSON
- `rules`: Array of calculation rules

**Example:**
```json
{
  "globals": {},
  "rules": [
    {
      "category": "Education",
      "service": "Kindergarten (3-6)",
      "basis": "age_3_6",
      "rule_text": "100% coverage / 30 kids per class",
      "required_expr": "ceil_div(age_3_6, 30)",
      "built_expr": "ceil_div(age_3_6, 30) * 130",
      "land_expr": "ceil_div(age_3_6, 30) * 0.5",
      "notes": "Based on planning standards"
    }
  ]
}
```

### Step 2: Building the Calculation Context



### Step 3: Evaluating Rules

For each rule, the system evaluates three expressions using the context:

#### Required Units Expression
Calculates how many service units are needed.

**Example:** `ceil_div(age_3_6, 30)` = Number of kindergarten classes needed

#### Built Area Expression (sqm)
Calculates the built area in square meters.

**Example:** `ceil_div(age_3_6, 30) * 130` = Total built area (130 sqm per class)

#### Land Area Expression (dunam)
Calculates the land area in dunams (1 dunam ≈ 1000 sqm).

**Example:** `ceil_div(age_3_6, 30) * 0.5` = Total land needed (0.5 dunam per class)

### Expression Language

Expressions support:

**Operators:**
- Arithmetic: `+`, `-`, `*`, `/`, `**` (power)
- Parentheses: `(`, `)`

**Built-in Functions:**
- `min(a, b)` - Returns minimum value
- `max(a, b)` - Returns maximum value
- `ceil_div(a, b)` - Ceiling division (rounds up)

**Variables:**
- Any variable from the context (e.g., `age_3_6`, `total`, `housing_units`)

**Examples:**
- `age_3_6 / 30` - Simple division
- `ceil_div(age_3_6, 30)` - Rounds up (useful for counting units)
- `ceil_div(age_3_6, 30) * 130` - Multiply by area per unit
- `max(10, ceil_div(total / 100, 5))` - Minimum threshold logic
- `(age_3_6 + age_6_12) * 0.8` - Combined age groups with percentage

### Safety Features

- **Controlled Evaluation:** Only allowed functions are available
- **No Builtins:** `__builtins__` is empty, preventing access to dangerous functions
- **No Attribute Access:** Cannot use dot notation to access object attributes
- **No Imports:** Cannot import modules within expressions
- **Error Handling:** If a rule fails to evaluate, it shows an error in the results instead of crashing

---

## Outputs

The simulator generates:

1. **Main Results Table**
   - Category, Service, Basis
   - Required Units (calculated)
   - Built Area (sqm)
   - Land Area (dunam)
   - Notes

2. **Per-Category Breakdown**
   - Organized tables for each service category
   - Helps understand requirements by domain

3. **Pie Chart**
   - Visualizes land use distribution by category
   - Only shows categories with positive land requirements

4. **CSV Export**
   - Download results for further analysis

---

## Rule Schema

Each rule in the rules JSON must contain:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | Yes | Service category (e.g., "Education", "Health") |
| `service` | string | Yes | Specific service name (e.g., "Kindergarten") |
| `basis` | string | Yes | Which population variable it's based on (informational) |
| `rule_text` | string | Yes | Human-readable rule description |
| `required_expr` | string | Yes | Expression to calculate required units |
| `built_expr` | string | No | Expression to calculate built area in sqm |
| `land_expr` | string | No | Expression to calculate land area in dunam |
| `notes` | string | No | Additional notes or constraints |

---

## Example Workflow

### Scenario: City Planning for 12,000 Residents

**Input - Population JSON:**
```json
{
  "population": {
    "total": 12000,
    "age_3_6": 850,
    "age_6_12": 1200,
    "age_12_18": 1100,
    "age_18_65": 7350,
    "age_65_plus": 1500
  }
}
```

**Input - Rules JSON:**
```json
{
  "rules": [
    {
      "category": "Education",
      "service": "Kindergarten (3-6 years)",
      "basis": "age_3_6",
      "rule_text": "1 class per 30 children",
      "required_expr": "ceil_div(age_3_6, 30)",
      "built_expr": "ceil_div(age_3_6, 30) * 130",
      "land_expr": "ceil_div(age_3_6, 30) * 0.5"
    },
    {
      "category": "Education",
      "service": "Elementary School (6-12 years)",
      "basis": "age_6_12",
      "rule_text": "1 class per 35 students",
      "required_expr": "ceil_div(age_6_12, 35)",
      "built_expr": "ceil_div(age_6_12, 35) * 250",
      "land_expr": "ceil_div(age_6_12, 35) * 1.0"
    },
    {
      "category": "Health",
      "service": "Clinic",
      "basis": "total",
      "rule_text": "1 clinic per 5,000 residents",
      "required_expr": "ceil_div(total, 5000)",
      "built_expr": "ceil_div(total, 5000) * 500",
      "land_expr": "ceil_div(total, 5000) * 0.2"
    }
  ]
}
```

**Output Example:**

| Category | Service | Required Units | Built Area (sqm) | Land Area (dunam) |
|----------|---------|-----------------|------------------|------------------|
| Education | Kindergarten (3-6 years) | 29 | 3,770 | 14.5 |
| Education | Elementary School (6-12 years) | 35 | 8,750 | 35.0 |
| Health | Clinic | 3 | 1,500 | 0.6 |

---

## Tips for Urban Planners

1. **Use `ceil_div()` for Units** - Always round up when calculating number of facilities/classes
2. **Test Scenarios** - Easily compare results by changing population data
3. **Adjust Standards** - Modify multipliers in expressions to match local planning standards
4. **Track Thresholds** - Use `max()` to enforce minimum requirements (e.g., at least 1 school even in small settlements)
5. **Combine Age Groups** - Use addition to group demographics (e.g., `(age_3_6 + age_6_12)`)

---

## File Structure

```
d:\DEV\PROGRAMA\
├── calculator_1.py      # Main Streamlit application
├── population.json      # Sample population data (loaded at startup)
├── rules.json           # Sample rules (loaded at startup)
└── README.md           # This file
```

---

## JSON File Format Notes

- **Encoding:** UTF-8
- **Pretty Printing:** Both JSON inputs are displayed with 2-space indentation
- **Auto-load:** `population.json` and `rules.json` are automatically loaded on startup as defaults
- **Fallback:** If files don't exist or are invalid, empty defaults are used

---

## Error Handling

If a rule expression fails to evaluate:
- The `required_units` field shows "ERROR"
- The error details are appended to the `notes` field
- The simulation continues to process other rules
- Check population data and expression syntax if errors occur
