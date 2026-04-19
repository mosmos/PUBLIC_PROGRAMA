import { useState, useCallback } from 'react';

const KEY = 'programa_simulations';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(sims) {
  try { localStorage.setItem(KEY, JSON.stringify(sims)); } catch {}
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useSimulations() {
  const [sims, setSims] = useState(loadFromStorage);

  const saveNew = useCallback((name, zone, results) => {
    const id = genId();
    const now = new Date().toISOString();
    const sim = {
      id,
      name,
      area_label: zone.name,
      zone_type: zone.type_heb,
      created_at: now,
      updated_at: now,
      version: 1,
      zone,
      results,
    };
    setSims(prev => {
      const next = { ...prev, [id]: sim };
      persist(next);
      return next;
    });
    return id;
  }, []);

  const saveVersion = useCallback((id, name, zone, results) => {
    setSims(prev => {
      const existing = prev[id] || {};
      const next = {
        ...prev,
        [id]: {
          ...existing,
          id,
          name,
          area_label: zone.name,
          zone_type: zone.type_heb,
          updated_at: new Date().toISOString(),
          version: (existing.version || 1) + 1,
          zone,
          results,
        },
      };
      persist(next);
      return next;
    });
  }, []);

  const saveCopy = useCallback((sim) => {
    const id = genId();
    const now = new Date().toISOString();
    const copy = {
      ...sim,
      id,
      name: `${sim.name} (עותק)`,
      created_at: now,
      updated_at: now,
      version: 1,
    };
    setSims(prev => {
      const next = { ...prev, [id]: copy };
      persist(next);
      return next;
    });
    return id;
  }, []);

  const deleteSim = useCallback((id) => {
    setSims(prev => {
      const next = { ...prev };
      delete next[id];
      persist(next);
      return next;
    });
  }, []);

  return { sims, saveNew, saveVersion, saveCopy, deleteSim };
}
