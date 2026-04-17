function ceilDiv(a, b) {
  if (b === 0) return 0;
  return Math.ceil(a / b);
}

function convertTernaryFull(expr) {
  let result = '';
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === '(') {
      let depth = 1, j = i + 1;
      while (j < expr.length && depth > 0) {
        if (expr[j] === '(') depth++;
        else if (expr[j] === ')') depth--;
        j++;
      }
      result += '(' + convertTernaryFull(expr.slice(i + 1, j - 1)) + ')';
      i = j;
    } else {
      result += expr[i++];
    }
  }
  return convertTopLevelTernary(result);
}

function convertTopLevelTernary(expr) {
  let depth = 0, ifIdx = -1, elseIdx = -1;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (depth === 0) {
      const prevOk = i === 0 || !/\w/.test(expr[i - 1]);
      if (prevOk && /^if\b/.test(expr.slice(i)) && ifIdx === -1) { ifIdx = i; }
      else if (prevOk && /^else\b/.test(expr.slice(i)) && ifIdx !== -1 && elseIdx === -1) { elseIdx = i; break; }
    }
  }
  if (ifIdx === -1 || elseIdx === -1) return expr;
  const then_ = expr.slice(0, ifIdx).trim();
  const cond_ = expr.slice(ifIdx + 2, elseIdx).trim();
  const else_ = convertTopLevelTernary(expr.slice(elseIdx + 4).trim());
  return `(${cond_}) ? (${then_}) : (${else_})`;
}

function pyToJS(expr) {
  if (!expr || !expr.trim()) return '';
  return convertTernaryFull(
    expr.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!')
  );
}

function evalExpr(jsExpr, ctx) {
  if (!jsExpr || !jsExpr.trim()) return null;
  const keys = Object.keys(ctx);
  const vals = keys.map(k => ctx[k]);
  try {
    // eslint-disable-next-line no-new-func
    return new Function('ceil_div', ...keys, `return (${jsExpr});`)(ceilDiv, ...vals);
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

export function buildContext(zone) {
  return { ...zone.pop, housing_units: zone.housing_units || 0, settlement_type: 'B' };
}

export function exprWithValues(pyExpr, ctx) {
  if (!pyExpr || !pyExpr.trim()) return null;
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

export function runRules(zone, rulesJson) {
  const ctx = buildContext(zone);
  return rulesJson.rules.map(r => {
    const reqJS   = pyToJS(r.required_expr || '');
    const builtJS = pyToJS(r.built_expr    || '');
    const landJS  = pyToJS(r.land_expr     || '');
    return {
      ...r,
      required_units: reqJS   ? evalExpr(reqJS,   ctx) : null,
      built_sqm:      builtJS ? evalExpr(builtJS, ctx) : null,
      land_dunam:     landJS  ? evalExpr(landJS,  ctx) : null,
    };
  });
}
