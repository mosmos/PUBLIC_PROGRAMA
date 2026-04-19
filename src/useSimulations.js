import { useState, useEffect } from 'react';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function apiGet() {
  const r = await fetch('/api/simulations');
  return r.json();
}

async function apiSave(sim) {
  await fetch('/api/simulations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sim),
  });
}

async function apiDelete(id) {
  await fetch(`/api/simulations/${id}`, { method: 'DELETE' });
}

export function useSimulations() {
  const [sims, setSims] = useState({});

  useEffect(() => {
    apiGet().then(setSims).catch(() => setSims({}));
  }, []);

  const saveNew = async (name, zone, results) => {
    const id = genId();
    const now = new Date().toISOString();
    const sim = {
      id, name, version: 1,
      area_label: zone.name, zone_type: zone.type_heb,
      zone, results,
      created_at: now, updated_at: now,
    };
    await apiSave(sim);
    setSims(prev => ({ ...prev, [id]: sim }));
    return id;
  };

  const saveVersion = async (id, name, zone, results) => {
    const existing = sims[id] || {};
    const sim = {
      ...existing,
      id, name, zone, results,
      area_label: zone.name, zone_type: zone.type_heb,
      version: (existing.version || 1) + 1,
      created_at: existing.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await apiSave(sim);
    setSims(prev => ({ ...prev, [id]: sim }));
  };

  const saveCopy = async (sim) => {
    const id = genId();
    const now = new Date().toISOString();
    const copy = { ...sim, id, name: `${sim.name} (עותק)`, version: 1, created_at: now, updated_at: now };
    await apiSave(copy);
    setSims(prev => ({ ...prev, [id]: copy }));
    return id;
  };

  const deleteSim = async (id) => {
    await apiDelete(id);
    setSims(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  return { sims, saveNew, saveVersion, saveCopy, deleteSim };
}
