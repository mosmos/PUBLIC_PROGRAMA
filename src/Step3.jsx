import { useMemo, useState } from 'react';
import WizardSteps from './WizardSteps';
import { runRules, buildContext, exprWithValues } from './calcEngine';
import rulesData from '../rules.json';

function SavePanel({ zone, currentSimId, onSave, onSaveCopy, onCatalog }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(zone.name);
  const [saved, setSaved] = useState(null); // 'new' | 'copy' | 'update'

  const handleSave = () => {
    onSave(name);
    setSaved(currentSimId ? 'update' : 'new');
    setOpen(false);
  };
  const handleCopy = () => {
    onSaveCopy(name);
    setSaved('copy');
    setOpen(false);
  };

  if (saved) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10,
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>
              {saved === 'copy' ? 'עותק נשמר בהצלחה' : saved === 'update' ? 'גרסה חדשה נשמרה' : 'הסימולציה נשמרה'}
            </div>
            <div style={{ fontSize: 12, color: '#4ade80' }}>"{name}"</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setSaved(null); setOpen(false); }} style={{
            padding: '6px 14px', borderRadius: 7, border: '1px solid #86efac',
            background: '#fff', color: '#15803d', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          }}>שמור שוב</button>
          <button onClick={onCatalog} style={{
            padding: '6px 14px', borderRadius: 7, border: 'none',
            background: '#16a34a', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
          }}>📋 עבור לקטלוג</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
      padding: open ? '14px 20px' : '0',
      overflow: 'hidden', transition: 'padding .15s',
    }}>
      {!open ? (
        <div style={{ display: 'flex', gap: 8, padding: '0' }}>
          <button onClick={() => setOpen(true)} style={{
            padding: '11px 22px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 6px rgba(37,99,235,.25)',
          }}>
            {currentSimId ? '💾 שמור גרסה חדשה' : '💾 שמור סימולציה'}
          </button>
          {currentSimId && (
            <button onClick={() => { setOpen(true); }} style={{
              padding: '11px 18px', borderRadius: 9, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>שמור עותק</button>
          )}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>שם הסימולציה</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              style={{
                flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 7,
                border: '1.5px solid #2563eb', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', color: '#1e293b',
              }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button onClick={handleSave} disabled={!name.trim()} style={{
              padding: '8px 18px', borderRadius: 7, border: 'none',
              background: name.trim() ? '#2563eb' : '#e2e8f0',
              color: name.trim() ? '#fff' : '#94a3b8',
              fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}>{currentSimId ? 'שמור גרסה' : 'שמור'}</button>
            <button onClick={handleCopy} disabled={!name.trim()} style={{
              padding: '8px 18px', borderRadius: 7, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#475569',
              fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}>שמור עותק</button>
            <button onClick={() => setOpen(false)} style={{
              padding: '8px 12px', borderRadius: 7, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>ביטול</button>
          </div>
        </>
      )}
    </div>
  );
}

const CAT_META = {
  'Education':           { color: '#4E9AF1', bg: '#eff6ff', icon: '🎓', label: 'חינוך' },
  'Health':              { color: '#0d9488', bg: '#f0fdfa', icon: '🏥', label: 'בריאות' },
  'Culture & Community': { color: '#d97706', bg: '#fffbeb', icon: '🎭', label: 'תרבות וקהילה' },
  'Welfare':             { color: '#ea580c', bg: '#fff7ed', icon: '🤝', label: 'רווחה' },
  'Emergency':           { color: '#dc2626', bg: '#fef2f2', icon: '🚨', label: 'חירום' },
  'Sports':              { color: '#7c3aed', bg: '#f5f3ff', icon: '⚽', label: 'ספורט' },
  'Open Space':          { color: '#16a34a', bg: '#f0fdf4', icon: '🌳', label: 'שטח פתוח' },
  'Citywide':            { color: '#ca8a04', bg: '#fefce8', icon: '🏙️', label: 'כלל עירוני' },
};

const POP_LABELS = {
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

function fmt(v, decimals = 1) {
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
  if (!basis) return [];
  return Object.keys(ctx).filter(
    k => k !== 'settlement_type' && new RegExp(`\\b${k}\\b`).test(basis)
  );
}

function DrillDown({ r, ctx, meta }) {
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
                    <div style={{
                      fontSize: 10, color: '#94a3b8', fontFamily: 'monospace',
                      marginBottom: 3, wordBreak: 'break-all',
                    }}>
                      {expr}
                    </div>
                    <div style={{
                      fontSize: 11, color: '#0369a1', fontFamily: 'monospace',
                      marginBottom: 10, wordBreak: 'break-all',
                      padding: '4px 7px', background: '#f0f9ff', borderRadius: 5,
                    }}>
                      ← {exprWithValues(expr, ctx)}
                    </div>
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

export default function Step3({ zone, onBack, onRestart, onCatalog, currentSimId, onSave, onSaveCopy }) {
  const [openDrill, setOpenDrill] = useState(null);

  const ctx     = useMemo(() => buildContext(zone), [zone]);
  const results = useMemo(() => runRules(zone, rulesData), [zone]);

  // Wrap save handlers so results are always included
  const handleSave = (name) => onSave(name, results);
  const handleSaveCopy = (name) => onSaveCopy(name, results);

  const grouped = useMemo(() => {
    const map = {};
    results.forEach(r => {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    });
    return map;
  }, [results]);

  const totalBuilt = results.reduce((s, r) => s + (typeof r.built_sqm  === 'number' ? r.built_sqm  : 0), 0);
  const totalLand  = results.reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);

  const toggleDrill = (key) => setOpenDrill(prev => prev === key ? null : key);

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", minHeight: '100vh', background: '#f0f4f8', padding: '24px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Wizard header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <WizardSteps current={3} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onBack} style={{
              padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600,
            }}>← חזרה לפרופיל</button>
            <button onClick={onCatalog} style={{
              padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}>📋 קטלוג</button>
            <button onClick={onRestart} style={{
              padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}>בחר אזור אחר</button>
          </div>
        </div>

        {/* Zone summary banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          borderRadius: 14, padding: '20px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, color: '#fff',
          boxShadow: '0 4px 16px rgba(37,99,235,.25)',
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 3 }}>{zone.name}</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{zone.type_heb} · רובע {zone.rova}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'אוכלוסייה',     value: zone.pop.total > 0 ? zone.pop.total.toLocaleString() : '—', unit: 'תושבים' },
              { label: 'יח"ד',          value: zone.housing_units > 0 ? zone.housing_units.toLocaleString() : '—', unit: 'יחידות' },
              { label: 'שטח בנוי נדרש', value: Math.round(totalBuilt).toLocaleString(), unit: 'מ"ר' },
              { label: 'קרקע נדרשת',    value: totalLand.toFixed(1), unit: 'דונם' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{m.value}</div>
                <div style={{ fontSize: 10, opacity: 0.65, marginTop: 1 }}>{m.unit}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Results by category */}
        {Object.entries(grouped).map(([cat, rows]) => {
          const meta = CAT_META[cat] || { color: '#94a3b8', bg: '#f8fafc', icon: '📋', label: cat };
          const catBuilt = rows.reduce((s, r) => s + (typeof r.built_sqm  === 'number' ? r.built_sqm  : 0), 0);
          const catLand  = rows.reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);
          return (
            <div key={cat} style={{
              background: '#fff', borderRadius: 12, marginBottom: 14,
              border: `1.5px solid ${meta.color}35`, overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,.05)',
            }}>
              {/* Category header */}
              <div style={{
                background: meta.bg, padding: '11px 18px',
                borderBottom: `1.5px solid ${meta.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: meta.color }}>{meta.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 18, fontSize: 12, color: '#64748b' }}>
                  {catBuilt > 0 && <span>בנוי: <strong style={{ color: meta.color }}>{Math.round(catBuilt).toLocaleString()} מ"ר</strong></span>}
                  {catLand  > 0 && <span>קרקע: <strong style={{ color: meta.color }}>{catLand.toFixed(1)} דונם</strong></span>}
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {[
                        { h: 'שירות',          style: { minWidth: 200 } },
                        { h: "יח' נדרשות",     style: { minWidth: 90,  textAlign: 'center' } },
                        { h: 'שטח בנוי (מ"ר)', style: { minWidth: 110, textAlign: 'center' } },
                        { h: 'קרקע (דונם)',    style: { minWidth: 90,  textAlign: 'center' } },
                        { h: '',               style: { width: 40 } },
                      ].map(({ h, style }, i) => (
                        <th key={i} style={{
                          padding: '8px 14px', textAlign: 'right', fontSize: 11,
                          fontWeight: 700, color: '#64748b',
                          borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                          ...style,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const key = `${cat}-${i}`;
                      const isOpen = openDrill === key;
                      const rowBg = isOpen ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa';
                      return (
                        <>
                          <tr
                            key={key}
                            onClick={() => toggleDrill(key)}
                            style={{
                              borderBottom: isOpen ? 'none' : '1px solid #f1f5f9',
                              background: rowBg,
                              cursor: 'pointer',
                              transition: 'background .12s',
                            }}
                            onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#f0f7ff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                          >
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: isOpen ? '#1d4ed8' : '#1e293b' }}>
                              {r.service}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, fontSize: 16, color: meta.color }}>
                              {fmt(r.required_units, 0)}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#475569' }}>{fmt(r.built_sqm)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#475569' }}>{fmt(r.land_dunam)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 22, height: 22, borderRadius: 6,
                                background: isOpen ? '#2563eb' : '#e2e8f0',
                                color: isOpen ? '#fff' : '#94a3b8',
                                fontSize: 10, fontWeight: 700, transition: 'all .15s',
                              }}>
                                {isOpen ? '▲' : '▼'}
                              </span>
                            </td>
                          </tr>
                          {isOpen && (
                            <DrillDown key={`dd-${key}`} r={r} ctx={ctx} meta={meta} />
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Save panel */}
        <div style={{ marginBottom: 16 }}>
          <SavePanel
            zone={zone}
            currentSimId={currentSimId}
            onSave={handleSave}
            onSaveCopy={handleSaveCopy}
            onCatalog={onCatalog}
          />
        </div>

        {/* Grand total */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '16px 28px', marginTop: 8,
          border: '1.5px solid #e2e8f0', display: 'flex', gap: 32,
          alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>סיכום כולל:</span>
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1e3a5f' }}>{Math.round(totalBuilt).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>מ"ר שטח בנוי</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1e3a5f' }}>{totalLand.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>דונם קרקע</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
