export async function calculateZone(zone) {
  const r = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone }),
  });
  if (!r.ok) throw new Error(`calculate failed: ${r.status}`);
  return r.json(); // { ctx, results }
}
