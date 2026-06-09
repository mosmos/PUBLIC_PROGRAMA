# How to Publish & Run — Programa Calculator v2

## Contents
1. [Requirements](#1-requirements)
2. [Local development (Windows)](#2-local-development-windows)
3. [Running on a server (Linux / Ubuntu)](#3-running-on-a-server-linux--ubuntu)
4. [Exposing the tool to users](#4-exposing-the-tool-to-users)
5. [Running behind a reverse proxy (Nginx)](#5-running-behind-a-reverse-proxy-nginx)
6. [Testing the API endpoints](#6-testing-the-api-endpoints)
7. [Sharing with testers](#7-sharing-with-testers)
8. [File structure reference](#8-file-structure-reference)

---

## 1. Requirements

| Dependency | Minimum version |
|------------|----------------|
| Python     | 3.10+          |
| fastapi    | 0.100+         |
| uvicorn    | 0.23+          |
| pydantic   | 2.0+           |

Install all dependencies in one command:

```bash
pip install fastapi uvicorn pydantic
```

No Node.js, no npm, no build step required.

---

## 2. Local development (Windows)

### Using the batch file (simplest)

1. Double-click **`run_server.bat`**
2. The browser opens automatically at `http://127.0.0.1:8001/`
3. To stop: close the terminal window or press `Ctrl+C`
4. To kill a stuck session: double-click **`kill_server.bat`**

### Manual start

```bat
cd api
D:\python\Python313\python.exe -m uvicorn service:app --host 127.0.0.1 --port 8001 --reload
```

`--reload` watches for changes to `.py` files and restarts automatically.  
After editing any `.json` rules file, save `service.py` (add/remove a space) to trigger a reload.

---

## 3. Running on a server (Linux / Ubuntu)

### Step 1 — Copy the project to the server

```bash
# Option A: clone from git
git clone <your-repo-url> /opt/programa_v2

# Option B: copy files manually
scp -r ./calculator_v_02 user@your-server:/opt/programa_v2
```

### Step 2 — Install Python dependencies

```bash
cd /opt/programa_v2
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic
```

### Step 3 — Run the server

**For testing (foreground):**

```bash
cd /opt/programa_v2/api
uvicorn service:app --host 0.0.0.0 --port 8001
```

**For production (background, auto-restart):**

Create a systemd service file at `/etc/systemd/system/programa.service`:

```ini
[Unit]
Description=Programa Calculator v2
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/programa_v2/api
ExecStart=/opt/programa_v2/.venv/bin/uvicorn service:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable programa
sudo systemctl start programa

# Check status
sudo systemctl status programa

# View live logs
sudo journalctl -u programa -f
```

---

## 4. Exposing the tool to users

### Option A — Direct access (quick test, no domain)

If your server has a public IP, open port 8001 in your firewall:

```bash
# Ubuntu / ufw
sudo ufw allow 8001/tcp
```

Users access the tool at:
```
http://<your-server-ip>:8001/
```

### Option B — Behind a domain with Nginx (recommended)

See [Section 5](#5-running-behind-a-reverse-proxy-nginx) below.

### Option C — Quick share with ngrok (no server needed)

Run locally and expose via ngrok for a temporary public URL:

```bash
# Install ngrok from https://ngrok.com
ngrok http 8001
```

ngrok prints a public URL like `https://abc123.ngrok.io` — share it with testers.  
The tunnel stays alive as long as your terminal is open.

---

## 5. Running behind a reverse proxy (Nginx)

Install Nginx:

```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/programa`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass         http://127.0.0.1:8001;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/programa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Users can now access the tool at `http://your-domain.com`.

**To add HTTPS** (free SSL via Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 6. Testing the API endpoints

Once the server is running, open your browser or use `curl` to test each endpoint.

### The form UI
```
GET http://localhost:8001/
```
Opens the population + services calculator form.

### List all zones
```
GET http://localhost:8001/api/zones
```
Returns the full `zones_data.json` as JSON — verify the neighborhoods list loads correctly.

### Get the rules catalog
```
GET http://localhost:8001/api/rules
```
Returns the merged rules from `rules.json`, `rules_haredim.json` (currently excluded), and `rules_extend.json`.

### Run a calculation (curl)

```bash
curl -X POST http://localhost:8001/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "zone": {
      "housing_units": 500,
      "plan_model": "B",
      "pop": {
        "total": 1250,
        "kinder": 125,
        "primary_school": 100,
        "high_school": 75,
        "elder70": 150,
        "haredi_p": 0,
        "traditional_p": 0,
        "special_ed_p": 0
      }
    }
  }'
```

Expected response: a JSON object with `ctx` (the resolved variables) and `results` (one entry per rule).

### Interactive API docs (built-in)

FastAPI generates documentation automatically:

| URL | Description |
|-----|-------------|
| `http://localhost:8001/docs` | Swagger UI — test all endpoints interactively |
| `http://localhost:8001/redoc` | ReDoc — clean read-only reference |

---

## 7. Sharing with testers

### Checklist before sharing

- [ ] Server is running and accessible from outside (test from a different device/network)
- [ ] `zones_data.json` loads correctly → visit `/api/zones`
- [ ] Rules load correctly → visit `/api/rules`
- [ ] Form opens → visit `/`
- [ ] Population calculation works end-to-end
- [ ] Services calculation returns results

### What to ask testers to check

1. Pick any neighborhood from the dropdown
2. Enter a number of new housing units (e.g. 500)
3. Click **חשב אוכלוסייה** — confirm the age breakdown table appears
4. Click **חשב שירותים נדרשים** — confirm the services table appears grouped by category
5. Try plan model **B** vs **C** and confirm built/land values change
6. Try with % traditional > 0 and confirm Synagogue / Mikveh rows become non-zero

### Reporting issues

Ask testers to share:
- The exact values they entered
- A screenshot of the result (or error)
- The browser console output (`F12 → Console`)

---

## 8. File structure reference

```
calculator_v_02/
├── api/
│   └── service.py            # FastAPI app — all endpoints and calculation engine
├── zones_data.json            # Neighborhood profiles (hh_size, population breakdown)
├── rules.json                 # Base rules catalog
├── rules_extend.json          # Extended rules (English-labeled, additional services)
├── rules_haredim.json         # Haredi education rules (currently excluded from loading)
├── population_form.html       # The two-panel web form (served at /)
├── run_server.bat             # Windows: start server + open browser
├── kill_server.bat            # Windows: kill all processes on port 8001
├── SPEC.md                    # Product specification
└── howto_publish.md           # This file
```

### Changing the port

Edit `run_server.bat` and `kill_server.bat` — change `set PORT=8001` to any free port.  
On Linux, change the `--port` argument in the uvicorn command or systemd service file.

### Re-enabling Haredi rules

In `api/service.py`, find the `load_rules` function and add `RULES_HAREDIM_FILE` back to the loop:

```python
for extra in (RULES_HAREDIM_FILE, RULES_EXTEND_FILE):
```
