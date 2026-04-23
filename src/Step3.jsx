import { useEffect, useMemo, useState } from 'react';
import TopBar from './TopBar';
import { calculateZone } from './api';
import { CAT_META, fmt, DrillDownPanel } from './DrillDownPanel';
import { C, F, R, FONT_FAMILY } from './theme';


const ACTIVE_COND_LABEL = {
  'haredi_pct > 0':           'הגדר % חרדים בשלב 2',
  'special_education_pct > 0':'הגדר % חינוך מיוחד בשלב 2',
  'traditional_pct > 0':      'הגדר % מסורתיים בשלב 2',
  'total >= 150000':           'אוכלוסייה מעל 150,000',
  'total >= 250000':           'אוכלוסייה מעל 250,000',
};

function EditableNum({ value, idx, field, overrides, setOverrides, decimals }) {
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
        width: 90, textAlign: 'center', padding: '4px 8px', borderRadius: R.sm,
        border: '1.5px solid ' + C.ink, fontSize: F.base, fontFamily: 'inherit', outline: 'none',
      }}
    />
  );

  return (
    <span
      onClick={e => { e.stopPropagation(); setDraft(String(display ?? '')); setEditing(true); }}
      title="לחץ לעריכה ידנית — הערך יישמר עם הסימולציה"
      style={{
        cursor: 'text', color: C.ink,
        fontWeight: isOverridden ? 800 : 600,
        borderBottom: isOverridden ? '1.5px dashed ' + C.ink : '1.5px solid transparent',
        paddingBottom: 1,
      }}
    >
      {fmt(display, decimals)}
      {isOverridden && <span style={{ fontSize: 10, color: C.ink, marginRight: 3, verticalAlign: 'super' }}>✎</span>}
    </span>
  );
}

export default function Step3({ zone, onBack, onRestart, onCatalog, currentSimId, onSave, onSaveCopy }) {
  const [openDrill, setOpenDrill] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [ctx, setCtx] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    calculateZone(zone)
      .then(({ ctx, results }) => { if (!cancelled) { setCtx(ctx); setResults(results); setLoading(false); } })
      .catch(e => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [zone]);

  const activeResults = useMemo(() => results.filter(r => r.isActive !== false), [results]);
  const inactiveResults = useMemo(() => results.filter(r => r.isActive === false), [results]);

  // Merge manual overrides into results for totals + saving
  const effectiveResults = useMemo(() =>
    activeResults.map((r, idx) => overrides[idx] ? { ...r, ...overrides[idx] } : r),
  [activeResults, overrides]);

  const handleSave = (name) => onSave(name, effectiveResults, ctx);
  const handleSaveCopy = (name) => onSaveCopy(name, effectiveResults, ctx);

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
    <div dir="rtl" style={{ fontFamily: FONT_FAMILY, minHeight: '100vh', background: C.bg }}>
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
      {loading && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 16px', textAlign: 'center', color: C.textDim, fontSize: F.large }}>
          מחשב תוצאות…
        </div>
      )}
      {err && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ background: C.surface, border: '1.5px solid ' + C.ink, borderRadius: R.md, padding: '14px 18px', color: C.ink }}>
            שגיאה בחישוב: {err}
          </div>
        </div>
      )}
      {!loading && !err && (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Zone summary banner */}
        <div style={{
          background: C.ink,
          borderRadius: R.lg, padding: '22px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, color: C.surface,
        }}>
          <div>
            <div style={{ fontSize: F.h1, fontWeight: 800, marginBottom: 4 }}>{zone.name}</div>
            <div style={{ fontSize: F.small, opacity: 0.75 }}>{zone.type_heb} · רובע {zone.rova}</div>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'אוכלוסייה',     value: zone.pop.total > 0 ? zone.pop.total.toLocaleString() : '—', unit: 'תושבים', help: 'סך כל התושבים באזור לפי פרופיל האוכלוסייה שהוזן' },
              { label: 'יח"ד',          value: zone.housing_units > 0 ? zone.housing_units.toLocaleString() : '—', unit: 'יחידות', help: 'מספר יחידות דיור מתוכננות באזור' },
              { label: 'שטח בנוי נדרש', value: Math.round(totalBuilt).toLocaleString(), unit: 'מ"ר', help: 'סך שטח בנוי נדרש לפי כללי הפרוגרמה, לכל הקטגוריות יחד' },
              { label: 'קרקע נדרשת',    value: totalLand.toFixed(1), unit: 'דונם', help: 'סך שטח קרקע נדרש עבור מבני ציבור ושטחים פתוחים' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }} title={m.help}>
                <div style={{ fontSize: F.metric, fontWeight: 800, lineHeight: 1.1 }}>{m.value}</div>
                <div style={{ fontSize: F.xs, opacity: 0.7, marginTop: 2 }}>{m.unit}</div>
                <div style={{ fontSize: F.small, opacity: 0.9, marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Inactive rules hint */}
        {inactiveResults.length > 0 && (
          <div style={{
            background: C.surface, border: '1px solid ' + C.line, borderRadius: R.md,
            padding: '14px 18px', marginBottom: 18,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
              background: C.ink, color: C.surface,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: F.small, fontWeight: 800,
            }} title="מידע">i</span>
            <div>
              <div style={{ fontSize: F.base, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                {inactiveResults.length} כללים נוספים אינם פעילים — ניתן להפעיל בשלב 2
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(inactiveByCondition).map(([cond, services]) => (
                  <span key={cond} style={{
                    fontSize: F.xs, background: C.panel, color: C.text,
                    padding: '4px 12px', borderRadius: 20, border: '1px solid ' + C.line,
                  }} title={`${services.length} שירותים ימתינו להפעלה: ${services.join('、 ')}`}>
                    {ACTIVE_COND_LABEL[cond] || cond}: {services.length} שירותים
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results by category */}
        {(() => {
          const globalIdx = {};
          effectiveResults.forEach((r, i) => { globalIdx[r.service] = i; });
          return Object.entries(grouped).map(([cat, rows]) => {
          const meta = CAT_META[cat] || { icon: '•', label: cat };
          const catBuilt = rows.reduce((s, r) => s + (typeof r.built_sqm  === 'number' ? r.built_sqm  : 0), 0);
          const catLand  = rows.reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);
          return (
            <div key={cat} style={{
              background: C.surface, borderRadius: R.md, marginBottom: 14,
              border: '1px solid ' + C.line, overflow: 'hidden',
            }}>
              <div style={{
                background: C.panel, padding: '12px 18px',
                borderBottom: '1px solid ' + C.line,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: F.large }}>{meta.icon}</span>
                  <span style={{ fontSize: F.large, fontWeight: 800, color: C.ink }}>{meta.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: F.small, color: C.textDim }}>
                  {catBuilt > 0 && <span>בנוי: <strong style={{ color: C.ink }}>{Math.round(catBuilt).toLocaleString()} מ"ר</strong></span>}
                  {catLand  > 0 && <span>קרקע: <strong style={{ color: C.ink }}>{catLand.toFixed(1)} דונם</strong></span>}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: F.base }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {[
                        { h: 'שירות',          style: { minWidth: 220 } },
                        { h: "יח' נדרשות",     style: { minWidth: 100, textAlign: 'center' }, title: 'מספר יחידות של השירות הנדרשות לפי כלל הפרוגרמה' },
                        { h: 'שטח בנוי (מ"ר)', style: { minWidth: 120, textAlign: 'center' }, title: 'שטח בנוי נדרש בתוך מבנה לשירות זה' },
                        { h: 'קרקע (דונם)',    style: { minWidth: 100, textAlign: 'center' }, title: 'שטח קרקע נדרש לשירות זה (כולל חצרות, חניה וכו׳)' },
                        { h: '',               style: { width: 44 } },
                      ].map(({ h, style, title }, i) => (
                        <th key={i} title={title} style={{
                          padding: '10px 14px', textAlign: 'right', fontSize: F.xs,
                          fontWeight: 700, color: C.textDim, textTransform: 'none',
                          borderBottom: '1px solid ' + C.line, whiteSpace: 'nowrap',
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
                      const rowBg = isOpen ? C.panel : i % 2 === 0 ? C.surface : C.bg;
                      return (
                        <>
                          <tr
                            key={key}
                            style={{
                              borderBottom: isOpen ? 'none' : '1px solid ' + C.lineSoft,
                              background: rowBg, transition: 'background .12s',
                            }}
                            onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = C.hover; }}
                            onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                          >
                            <td
                              onClick={() => toggleDrill(key)}
                              style={{ padding: '12px 14px', fontWeight: 600, cursor: 'pointer', color: C.ink }}
                              title="לחץ להצגת פירוט החישוב"
                            >
                              {r.service}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, fontSize: F.large }}>
                              <EditableNum value={r.required_units} idx={gIdx} field="required_units"
                                overrides={overrides} setOverrides={setOverrides} decimals={0} />
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <EditableNum value={r.built_sqm} idx={gIdx} field="built_sqm"
                                overrides={overrides} setOverrides={setOverrides} decimals={1} />
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <EditableNum value={r.land_dunam} idx={gIdx} field="land_dunam"
                                overrides={overrides} setOverrides={setOverrides} decimals={2} />
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', cursor: 'pointer' }}
                              onClick={() => toggleDrill(key)} title="פתח/סגור פירוט">
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 26, height: 26, borderRadius: R.sm,
                                background: isOpen ? C.ink : C.lineSoft,
                                color: isOpen ? C.surface : C.mute,
                                fontSize: F.xs, fontWeight: 700,
                              }}>
                                {isOpen ? '▲' : '▼'}
                              </span>
                            </td>
                          </tr>
                          {isOpen && (
                            <DrillDownPanel key={`dd-${key}`} r={r} ctx={ctx} />
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
          background: C.surface, borderRadius: R.md, padding: '18px 28px', marginTop: 10,
          border: '1px solid ' + C.line, display: 'flex', gap: 32,
          alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: F.base, fontWeight: 700, color: C.textDim }}>סיכום כולל:</span>
          <div style={{ display: 'flex', gap: 36 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: F.metric, fontWeight: 800, color: C.ink }}>{Math.round(totalBuilt).toLocaleString()}</div>
              <div style={{ fontSize: F.xs, color: C.mute }}>מ"ר שטח בנוי</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: F.metric, fontWeight: 800, color: C.ink }}>{totalLand.toFixed(1)}</div>
              <div style={{ fontSize: F.xs, color: C.mute }}>דונם קרקע</div>
            </div>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
