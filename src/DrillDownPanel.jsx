import { exprWithValues } from './calcEngine';

export const CAT_META = {
  'Education':           { color: '#4E9AF1', bg: '#eff6ff', icon: '🎓', label: 'חינוך' },
  'Health':              { color: '#0d9488', bg: '#f0fdfa', icon: '🏥', label: 'בריאות' },
  'Culture & Community': { color: '#d97706', bg: '#fffbeb', icon: '🎭', label: 'תרבות וקהילה' },
  'Welfare':             { color: '#ea580c', bg: '#fff7ed', icon: '🤝', label: 'רווחה' },
  'Emergency':           { color: '#dc2626', bg: '#fef2f2', icon: '🚨', label: 'חירום' },
  'Sports':              { color: '#7c3aed', bg: '#f5f3ff', icon: '⚽', label: 'ספורט' },
  'Open Space':          { color: '#16a34a', bg: '#f0fdf4', icon: '🌳', label: 'שטח פתוח' },
  'Citywide':            { color: '#ca8a04', bg: '#fefce8', icon: '🏙️', label: 'כלל עירוני' },
  'Religion':            { color: '#7e22ce', bg: '#faf5ff', icon: '✡️', label: 'דת' },
};

export const POP_LABELS = {
  total:        'סה"כ תושבים',
  age_0_1:      'תינוקות 0–1',
  age_0_3:      'ילדים 0–3',
  age_1_6:      'ילדים 1–6',
  age_0_6:      'ילדים 0–6',
  age_3_6:      'ילדים 3–6',
  age_6_12:     'ילדים 6–12',
  age_11_18:    'נוער 11–18',
  age_12_18:    'נוער 12–18',
  age_18_45:    'בוגרים 18–45',
  age_45_70:    'מבוגרים 45–70',
  age_70_plus:  'קשישים 70+',
  housing_units: 'יח"ד',
};

export function fmt(v, decimals = 1) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v.startsWith('ERROR')
    ? <span style={{ color: '#ef4444', fontSize: 11 }}>⚠️ שגיאה</span>
    : v;
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  if (n === 0) return '0';
  if (decimals === 0 || Number.isInteger(n)) return Math.round(n).toLocaleString();
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function getBasisVars(basis, ctx) {
  if (!basis || !ctx) return [];
  return Object.keys(ctx).filter(
    k => k !== 'settlement_type' && new RegExp(`\\b${k}\\b`).test(basis)
  );
}

export function DrillDownPanel({ r, ctx, meta }) {
  const calcRows = [
    { label: "יחידות נדרשות", expr: r.required_expr, result: r.required_units, color: meta.color, decimals: 0 },
    { label: 'שטח בנוי (מ"ר)', expr: r.built_expr,    result: r.built_sqm,      color: '#475569',  decimals: 0 },
    { label: 'קרקע (דונם)',    expr: r.land_expr,     result: r.land_dunam,     color: '#475569',  decimals: 2 },
  ];
  const basisVars = getBasisVars(r.basis, ctx);

  return (
    <tr>
      <td colSpan={5} style={{ padding: 0, background: '#f0f7ff', borderBottom: `2px solid ${meta.color}40` }}>
        <div style={{ padding: '18px 24px 20px', direction: 'rtl' }}>

          {/* Rule text */}
          <div style={{
            fontSize: 13, color: '#1e3a5f', fontWeight: 600,
            padding: '10px 14px', marginBottom: 14,
            background: '#fff', borderRadius: 8,
            borderRight: `3px solid ${meta.color}`,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          }}>
            {r.rule}
          </div>

          {/* Basis variables */}
          {basisVars.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>בסיס חישוב:</span>
              {basisVars.map(k => (
                <span key={k} style={{
                  fontFamily: 'monospace', background: '#e0f2fe', color: '#0369a1',
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  border: '1px solid #bae6fd',
                }}>
                  {k} = {Number.isInteger(ctx[k]) ? ctx[k].toLocaleString() : ctx[k]}
                  {POP_LABELS[k] && (
                    <span style={{ fontFamily: 'inherit', fontWeight: 400, color: '#0284c7', marginRight: 5 }}>
                      ({POP_LABELS[k]})
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Calculation cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {calcRows.map(({ label, expr, result, color, decimals }) => (
              <div key={label} style={{
                background: '#fff', borderRadius: 10, padding: '13px 15px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>{label}</div>
                {expr ? (
                  <>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 3, wordBreak: 'break-all' }}>
                      {expr}
                    </div>
                    {ctx && (
                      <div style={{
                        fontSize: 11, color: '#0369a1', fontFamily: 'monospace',
                        marginBottom: 10, wordBreak: 'break-all',
                        padding: '4px 7px', background: '#f0f9ff', borderRadius: 5,
                      }}>
                        ← {exprWithValues(expr, ctx)}
                      </div>
                    )}
                    <div style={{ fontSize: 22, fontWeight: 800, color }}>{fmt(result, decimals)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#cbd5e1', paddingTop: 6 }}>לא מוגדר</div>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          {r.notes && (
            <div style={{
              fontSize: 12, color: '#64748b', display: 'flex', gap: 6,
              alignItems: 'flex-start', background: '#fff', borderRadius: 7,
              padding: '8px 12px', border: '1px solid #e2e8f0',
            }}>
              <span style={{ flexShrink: 0 }}>📝</span>
              <span>{r.notes}</span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
