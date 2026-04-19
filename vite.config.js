import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./simulations_data");

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function sendJSON(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}

function simulationsAPI() {
  return {
    name: "simulations-api",
    configureServer(server) {
      server.middlewares.use("/api/simulations", async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        // Extract id from path e.g. /abc123
        const idMatch = url.pathname.match(/^\/([a-z0-9]+)$/);
        const id = idMatch?.[1];

        try {
          if (req.method === "GET") {
            // List all wizard_*.json files
            const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith("wizard_") && f.endsWith(".json"));
            const sims = {};
            for (const f of files) {
              try {
                const sim = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
                sims[sim.id] = sim;
              } catch { /* skip corrupt files */ }
            }
            return sendJSON(res, 200, sims);
          }

          if (req.method === "POST") {
            const sim = await readBody(req);
            if (!sim.id) return sendJSON(res, 400, { error: "missing id" });
            fs.writeFileSync(path.join(DATA_DIR, `wizard_${sim.id}.json`), JSON.stringify(sim, null, 2));
            return sendJSON(res, 200, { ok: true });
          }

          if (req.method === "DELETE" && id) {
            const file = path.join(DATA_DIR, `wizard_${id}.json`);
            if (fs.existsSync(file)) fs.unlinkSync(file);
            return sendJSON(res, 200, { ok: true });
          }

          next();
        } catch (err) {
          sendJSON(res, 500, { error: String(err) });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), simulationsAPI()],
});
