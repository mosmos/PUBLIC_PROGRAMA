export function exprWithValues(pyExpr, ctx) {
  if (!pyExpr || !pyExpr.trim() || !ctx) return null;
  let result = pyExpr;
  const keys = Object.keys(ctx).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const v = ctx[k];
    if (typeof v !== 'number') continue;
    const display = Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
    result = result.replace(new RegExp(`\\b${k}\\b`, 'g'), display);
  }
  return result;
}
