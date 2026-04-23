import { exprWithValues } from './exprFormat';
import { C, F, R } from './theme';

// v2: monochrome. Each category gets a single grayscale marker
// (symbol + label) instead of color. Icons kept as textual glyphs only.
export const CAT_META = {
  'Education':           { icon: '🎓', label: 'חינוך' },
  'Health':              { icon: '🏥', label: 'בריאות' },
  'Culture & Community': { icon: '🎭', label: 'תרבות וקהילה' },
  'Welfare':             { icon: '🤝', label: 'רווחה' },
  'Emergency':           { icon: '🚨', label: 'חירום' },
  'Sports':              { icon: '⚽', label: 'ספורט' },
  'Open Space':          { icon: '🌳', label: 'שטח פתוח' },
  'Citywide':            { icon: '🏙️', label: 'כלל עירוני' },
  'Religion':            { icon: '✡️', label: 'דת' },
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
    ? <span style={{ color: C.ink, fontSize: F.xs }}>⚠️ שגיאה</span>
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

export function DrillDownPanel({ r, ctx }) {
  const calcRows = [
    { label: 'יחידות נדרשות',  expr: r.required_expr, result: r.required_units, decimals: 0 },
    { label: 'שטח בנוי (מ"ר)', expr: r.built_expr,    result: r.built_sqm,      decimals: 0 },
    { label: 'קרקע (דונם)',    expr: r.land_expr,     result: r.land_dunam,     decimals: 2 },
  ];
  const basisVars = getBasisVars(r.basis, ctx);

  return (
    <tr>
      <td colSpan={5} style={{ padding: 0, background: C.panel, borderBottom: '2px solid ' + C.ink }}>
        <div style={{ padding: '20px 24px', direction: 'rtl' }}>

          <div style={{
            fontSize: F.base, color: C.ink, fontWeight: 600,
            padding: '12px 16px', marginBottom: 16,
            background: C.surface, borderRadius: R.md,
            borderRight: '4px solid ' + C.ink,
          }}>
            {r.rule}
          </div>

          {basisVars.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontSize: F.small, fontWeight: 700, color: C.textDim }} title="המשתנים המשמשים לחישוב הכלל הזה">
                בסיס חישוב:
              </span>
              {basisVars.map(k => (
                <span key={k} style={{
                  fontFamily: 'monospace', background: C.surface, color: C.ink,
                  padding: '4px 10px', borderRadius: R.sm, fontSize: F.small, fontWeight: 700,
                  border: '1px solid ' + C.line,
                }} title={POP_LABELS[k] || k}>
                  {k} = {Number.isInteger(ctx[k]) ? ctx[k].toLocaleString() : ctx[k]}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {calcRows.map(({ label, expr, result, decimals }) => (
              <div key={label} style={{
                background: C.surface, borderRadius: R.md, padding: '14px 16px',
                border: '1px solid ' + C.line,
              }}>
                <div style={{ fontSize: F.small, fontWeight: 700, color: C.textDim, marginBottom: 10 }}>{label}</div>
                {expr ? (
                  <>
                    <div style={{ fontSize: F.xs, color: C.mute, fontFamily: 'monospace', marginBottom: 4, wordBreak: 'break-all' }} title="נוסחת החישוב">
                      {expr}
                    </div>
                    {ctx && (
                      <div style={{
                        fontSize: F.small, color: C.text, fontFamily: 'monospace',
                        marginBottom: 10, wordBreak: 'break-all',
                        padding: '5px 8px', background: C.panel, borderRadius: R.sm,
                      }} title="הנוסחה עם ערכים מוחלפים">
                        ← {exprWithValues(expr, ctx)}
                      </div>
                    )}
                    <div style={{ fontSize: F.h2, fontWeight: 800, color: C.ink }}>{fmt(result, decimals)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: F.base, color: C.mute, paddingTop: 6 }}>לא מוגדר</div>
                )}
              </div>
            ))}
          </div>

          {r.notes && (
            <div style={{
              fontSize: F.small, color: C.textDim, display: 'flex', gap: 8,
              alignItems: 'flex-start', background: C.surface, borderRadius: R.sm,
              padding: '10px 14px', border: '1px solid ' + C.line,
            }}>
              <span style={{ flexShrink: 0 }}>הערה:</span>
              <span>{r.notes}</span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
