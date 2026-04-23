import { useState, useEffect } from 'react';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function apiList() {
  const r = await fetch('/api/scenarios');
  return r.json();
}

async function apiSave(sim) {
  await fetch('/api/scenarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sim),
  });
}

async function apiDelete(id) {
  await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
}

export function useSimulations() {
  const [sims, setSims] = useState({});

  useEffect(() => {
    apiList().then(setSims).catch(() => setSims({}));
  }, []);

  const saveNew = async (name, zone, results, ctx) => {
    const id = genId();
    const now = new Date().toISOString();
    const sim = {
      id, name, version: 1,
      area_label: zone.name, zone_type: zone.type_heb,
      zone, results, ctx,
      created_at: now, updated_at: now,
    };
    await apiSave(sim);
    setSims(prev => ({ ...prev, [id]: sim }));
    return id;
  };

  const saveVersion = async (id, name, zone, results, ctx) => {
    const existing = sims[id] || {};
    const sim = {
      ...existing,
      id, name, zone, results, ctx,
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
