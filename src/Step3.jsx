import { useMemo, useState } from 'react';
import TopBar from './TopBar';
import { runRules, buildContext } from './calcEngine';
import { CAT_META, fmt, DrillDownPanel } from './DrillDownPanel';
import rulesData from '../rules.json';
import rulesExtend from '../rules_extend.json';

const ALL_RULES = { rules: [...rulesData.rules, ...rulesExtend.rules] };

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


const ACTIVE_COND_LABEL = {
  'haredi_pct > 0':           'הגדר % חרדים בשלב 2',
  'special_education_pct > 0':'הגדר % חינוך מיוחד בשלב 2',
  'traditional_pct > 0':      'הגדר % מסורתיים בשלב 2',
  'total >= 150000':           'אוכלוסייה מעל 150,000',
  'total >= 250000':           'אוכלוסייה מעל 250,000',
};

function EditableNum({ value, idx, field, overrides, setOverrides, decimals, color }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const isOverridden = overrides[idx]?.[field] !== undefined;
  const display = isOverridden ? overrides[idx][field] : value;

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n)) setOverrides(prev => ({ ...prev, [idx]: { ...(prev[idx] || {}), [field]: n } }));
    setEditing(false);
  };

  if (editing) return (
    <input
      type="number" autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      onClick={e => e.stopPropagation()}
      style={{
        width: 80, textAlign: 'center', padding: '3px 6px', borderRadius: 5,
        border: '1.5px solid #2563eb', fontSize: 13, fontFamily: 'inherit', outline: 'none',
      }}
    />
  );

  return (
    <span
      onClick={e => { e.stopPropagation(); setDraft(String(display ?? '')); setEditing(true); }}
      title="לחץ לעריכה"
      style={{
        cursor: 'text', color: isOverridden ? '#2563eb' : (color || '#475569'),
        fontWeight: isOverridden ? 800 : undefined,
        borderBottom: isOverridden ? '1.5px dashed #93c5fd' : '1.5px solid transparent',
        paddingBottom: 1,
      }}
    >
      {fmt(display, decimals)}
      {isOverridden && <span style={{ fontSize: 9, color: '#2563eb', marginRight: 2, verticalAlign: 'super' }}>✎</span>}
    </span>
  );
}

export default function Step3({ zone, onBack, onRestart, onCatalog, currentSimId, onSave, onSaveCopy }) {
  const [openDrill, setOpenDrill] = useState(null);
  const [overrides, setOverrides] = useState({});

  const ctx     = useMemo(() => buildContext(zone), [zone]);
  const results = useMemo(() => runRules(zone, ALL_RULES), [zone]);

  const activeResults = useMemo(() => results.filter(r => r.isActive !== false), [results]);
  const inactiveResults = useMemo(() => results.filter(r => r.isActive === false), [results]);

  // Merge manual overrides into results for totals + saving
  const effectiveResults = useMemo(() =>
    activeResults.map((r, idx) => overrides[idx] ? { ...r, ...overrides[idx] } : r),
  [activeResults, overrides]);

  const handleSave = (name) => onSave(name, effectiveResults);
  const handleSaveCopy = (name) => onSaveCopy(name, effectiveResults);

  const grouped = useMemo(() => {
    const map = {};
    effectiveResults.forEach(r => {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    });
    return map;
  }, [effectiveResults]);

  // Group inactive rules by their activation condition for the hint bar
  const inactiveByCondition = useMemo(() => {
    const map = {};
    inactiveResults.forEach(r => {
      const key = r.is_active_condition || 'other';
      if (!map[key]) map[key] = [];
      map[key].push(r.service);
    });
    return map;
  }, [inactiveResults]);

  const totalBuilt = effectiveResults.reduce((s, r) => s + (typeof r.built_sqm  === 'number' ? r.built_sqm  : 0), 0);
  const totalLand  = effectiveResults.reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);

  const toggleDrill = (key) => setOpenDrill(prev => prev === key ? null : key);

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", minHeight: '100vh', background: '#f0f4f8' }}>
      <TopBar
        step={3}
        zone={zone}
        currentSimId={currentSimId}
        onBack={onBack}
        onCatalog={onCatalog}
        onRestart={onRestart}
        onSave={handleSave}
        onSaveCopy={handleSaveCopy}
      />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

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

        {/* Inactive rules hint */}
        {inactiveResults.length > 0 && (
          <div style={{
            background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 10,
            padding: '12px 18px', marginBottom: 18,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                {inactiveResults.length} כללים נוספים אינם פעילים — ניתן להפעיל בשלב 2
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(inactiveByCondition).map(([cond, services]) => (
                  <span key={cond} style={{
                    fontSize: 11, background: '#fef9c3', color: '#78350f',
                    padding: '3px 9px', borderRadius: 20, border: '1px solid #fde68a',
                  }}>
                    {ACTIVE_COND_LABEL[cond] || cond}: {services.length} שירותים
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results by category */}
        {(() => {
          // build service → global effectiveResults index map
          const globalIdx = {};
          effectiveResults.forEach((r, i) => { globalIdx[r.service] = i; });
          return Object.entries(grouped).map(([cat, rows]) => {
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
                      const gIdx = globalIdx[r.service] ?? -1;
                      const isOpen = openDrill === key;
                      const rowBg = isOpen ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa';
                      return (
                        <>
                          <tr
                            key={key}
                            style={{
                              borderBottom: isOpen ? 'none' : '1px solid #f1f5f9',
                              background: rowBg, transition: 'background .12s',
                            }}
                            onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#f0f7ff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                          >
                            <td
                              onClick={() => toggleDrill(key)}
                              style={{ padding: '10px 14px', fontWeight: 600, cursor: 'pointer',
                                color: isOpen ? '#1d4ed8' : '#1e293b' }}
                            >
                              {r.service}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, fontSize: 16 }}>
                              <EditableNum value={r.required_units} idx={gIdx} field="required_units"
                                overrides={overrides} setOverrides={setOverrides} decimals={0} color={meta.color} />
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <EditableNum value={r.built_sqm} idx={gIdx} field="built_sqm"
                                overrides={overrides} setOverrides={setOverrides} decimals={1} />
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <EditableNum value={r.land_dunam} idx={gIdx} field="land_dunam"
                                overrides={overrides} setOverrides={setOverrides} decimals={2} />
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', cursor: 'pointer' }}
                              onClick={() => toggleDrill(key)}>
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
                            <DrillDownPanel key={`dd-${key}`} r={r} ctx={ctx} meta={meta} />
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        });
        })()}

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
