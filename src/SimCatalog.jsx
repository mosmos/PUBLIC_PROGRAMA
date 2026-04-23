import { useState, useMemo } from 'react';
import { CAT_META, fmt, DrillDownPanel } from './DrillDownPanel';
import { C, F, R, FONT_FAMILY } from './theme';


function FullModal({ sim, onClose }) {
  const [openDrill, setOpenDrill] = useState(null);
  const ctx = sim.ctx || null;

  const grouped = useMemo(() => {
    const map = {};
    (sim.results || []).forEach(r => {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    });
    return map;
  }, [sim.results]);

  const totalBuilt = (sim.results || []).reduce((s, r) => s + (typeof r.built_sqm === 'number' ? r.built_sqm : 0), 0);
  const totalLand  = (sim.results || []).reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 12px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div dir="rtl" style={{
        background: C.bg, borderRadius: R.lg, width: '100%', maxWidth: 900,
        fontFamily: FONT_FAMILY, overflow: 'hidden',
      }}>
        <div style={{
          background: C.ink, padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: F.h2, fontWeight: 800, color: C.surface }}>{sim.name}</div>
            <div style={{ fontSize: F.small, color: '#cccccc', marginTop: 4 }}>
              {sim.area_label} · v{sim.version} ·{' '}
              <span style={{ marginRight: 14 }}>בנוי: {Math.round(totalBuilt).toLocaleString()} מ"ר</span>
              <span>קרקע: {totalLand.toFixed(1)} דונם</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid ' + C.surface, borderRadius: R.sm,
            color: C.surface, fontSize: F.base, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ סגור</button>
        </div>

        <div style={{ padding: '16px' }}>
          {Object.entries(grouped).map(([cat, rows]) => {
            const meta = CAT_META[cat] || { icon: '•', label: cat };
            const catBuilt = rows.reduce((s, r) => s + (typeof r.built_sqm  === 'number' ? r.built_sqm  : 0), 0);
            const catLand  = rows.reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);
            return (
              <div key={cat} style={{
                background: C.surface, borderRadius: R.md, marginBottom: 12,
                border: '1px solid ' + C.line, overflow: 'hidden',
              }}>
                <div style={{
                  background: C.panel, padding: '12px 18px',
                  borderBottom: '1px solid ' + C.line,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>{meta.icon}</span>
                    <span style={{ fontSize: F.large, fontWeight: 800, color: C.ink }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: F.small, color: C.textDim, display: 'flex', gap: 16 }}>
                    {catBuilt > 0 && <span>בנוי: <strong style={{ color: C.ink }}>{Math.round(catBuilt).toLocaleString()} מ"ר</strong></span>}
                    {catLand  > 0 && <span>קרקע: <strong style={{ color: C.ink }}>{catLand.toFixed(1)} דונם</strong></span>}
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: F.base }}>
                  <tbody>
                    {rows.map((r, i) => {
                      const key = `${cat}-${i}`;
                      const isOpen = openDrill === key;
                      return (
                        <>
                          <tr key={key}
                            onClick={() => setOpenDrill(prev => prev === key ? null : key)}
                            style={{
                              borderBottom: isOpen ? 'none' : '1px solid ' + C.lineSoft,
                              background: isOpen ? C.panel : i % 2 === 0 ? C.surface : C.bg,
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ padding: '11px 16px', fontWeight: 600, color: C.ink }}>
                              {r.service}
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: C.ink, minWidth: 80 }}>
                              {fmt(r.required_units, 0)}
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'center', color: C.text, minWidth: 100 }}>
                              {fmt(r.built_sqm)} מ"ר
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'center', color: C.text, minWidth: 90 }}>
                              {fmt(r.land_dunam)} ד'
                            </td>
                            <td style={{ padding: '11px 12px', textAlign: 'center', width: 38 }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 22, height: 22, borderRadius: R.sm,
                                background: isOpen ? C.ink : C.lineSoft,
                                color: isOpen ? C.surface : C.mute, fontSize: F.xs, fontWeight: 700,
                              }}>{isOpen ? '▲' : '▼'}</span>
                            </td>
                          </tr>
                          {isOpen && ctx && (
                            <DrillDownPanel key={`dd-${key}`} r={r} ctx={ctx} />
                          )}
                          {isOpen && !ctx && (
                            <tr><td colSpan={5} style={{ padding: '12px 18px', color: C.mute, fontSize: F.small, background: C.panel }}>
                              פירוט לא זמין לסימולציה שמורה — פתח את הסימולציה מחדש לחישוב עדכני
                            </td></tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResultsPreview({ results }) {
  const grouped = useMemo(() => {
    const map = {};
    (results || []).forEach(r => {
      if (!map[r.category]) map[r.category] = { built: 0, land: 0, services: [] };
      map[r.category].built += typeof r.built_sqm  === 'number' ? r.built_sqm  : 0;
      map[r.category].land  += typeof r.land_dunam === 'number' ? r.land_dunam : 0;
      map[r.category].services.push(r);
    });
    return map;
  }, [results]);

  const totalBuilt = Object.values(grouped).reduce((s, c) => s + c.built, 0);
  const rows = Object.entries(grouped);

  if (!results || results.length === 0) {
    return <div style={{ padding: '8px 20px', color: C.mute, fontSize: F.small }}>אין תוצאות שמורות</div>;
  }

  return (
    <div style={{ borderTop: '1px solid ' + C.lineSoft, background: C.panel, padding: '10px 22px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        columnGap: 22, rowGap: 4,
      }}>
        {rows.map(([cat, data]) => {
          const meta = CAT_META[cat] || { icon: '•', label: cat };
          const barPct = totalBuilt > 0 ? (data.built / totalBuilt) * 100 : 0;
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
              title={`${meta.label} — ${data.services.length} שירותים · ${Math.round(data.built).toLocaleString()} מ"ר · ${data.land.toFixed(1)} דונם`}>
              <span style={{ fontSize: F.xs, color: C.text, width: 78, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {meta.icon} {meta.label}
              </span>
              <div style={{ flex: 1, height: 6, background: C.lineSoft, borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
                <div style={{ width: `${barPct}%`, height: '100%', background: C.ink }} />
              </div>
              <span style={{ fontSize: F.xs, color: C.textDim, width: 72, textAlign: 'left', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(data.built).toLocaleString()} מ"ר
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

const BTN_PRIMARY = {
  padding: '8px 18px', borderRadius: R.md, border: '1px solid ' + C.ink,
  background: C.ink, color: C.surface, fontSize: F.base,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};
const BTN_GHOST = {
  padding: '8px 16px', borderRadius: R.md, border: '1px solid ' + C.line,
  background: C.surface, color: C.ink, fontSize: F.base,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

function EmptyState({ onNew }) {
  return (
    <div style={{ textAlign: 'center', padding: '72px 24px', color: C.mute }}>
      <div style={{ fontSize: 56, marginBottom: 18 }}>⌂</div>
      <div style={{ fontSize: F.h2, fontWeight: 700, color: C.ink, marginBottom: 10 }}>אין סימולציות שמורות</div>
      <div style={{ fontSize: F.base, marginBottom: 26 }}>צור סימולציה חדשה כדי להתחיל</div>
      <button onClick={onNew} style={BTN_PRIMARY}>+ סימולציה חדשה</button>
    </div>
  );
}

export default function SimCatalog({ sims, onNew, onOpen, onEdit, onCopy, onDelete }) {
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(() => new Set());
  const [modalSim, setModalSim] = useState(null);

  const togglePreview = (id) => setPreviewOpen(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const expandAll = () => setPreviewOpen(new Set(list.map(s => s.id)));
  const collapseAll = () => setPreviewOpen(new Set());

  const list = Object.values(sims)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.area_label?.toLowerCase().includes(q);
    });

  const totalBuilt = (sim) =>
    (sim.results || []).reduce((s, r) => s + (typeof r.built_sqm === 'number' ? r.built_sqm : 0), 0);
  const totalLand = (sim) =>
    (sim.results || []).reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);

  return (
    <>
    {modalSim && <FullModal sim={modalSim} onClose={() => setModalSim(null)} />}
    <div dir="rtl" style={{ fontFamily: FONT_FAMILY, minHeight: '100vh', background: C.bg, padding: '28px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: F.h1, fontWeight: 800, color: C.ink, margin: 0 }}>קטלוג סימולציות</h1>
            <div style={{ fontSize: F.small, color: C.mute, marginTop: 4 }}>
              {list.length} סימולציות {search ? 'תואמות' : 'שמורות'}
            </div>
          </div>
          <button onClick={onNew} style={BTN_PRIMARY} title="התחל סימולציה חדשה">+ סימולציה חדשה</button>
        </div>

        {Object.keys(sims).length > 0 && (
          <div style={{ marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="חיפוש לפי שם או אזור..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 240, padding: '12px 16px', borderRadius: R.md,
                border: '1px solid ' + C.line, fontSize: F.base, outline: 'none',
                fontFamily: 'inherit', background: C.surface, color: C.ink,
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = C.ink)}
              onBlur={e => (e.target.style.borderColor = C.line)}
            />
            <button onClick={expandAll} style={BTN_GHOST} title="פתח תצוגה מקדימה לכל הסימולציות להשוואה">
              פתח הכל להשוואה
            </button>
            {previewOpen.size > 0 && (
              <button onClick={collapseAll} style={BTN_GHOST} title="סגור את כל התצוגות המקדימות">
                סגור הכל
              </button>
            )}
          </div>
        )}

        {Object.keys(sims).length === 0 && <EmptyState onNew={onNew} />}

        {list.map(sim => {
          const built = totalBuilt(sim);
          const land = totalLand(sim);
          const isConfirm = deleteConfirm === sim.id;
          const isPreviewing = previewOpen.has(sim.id);
          return (
            <div key={sim.id} style={{
              background: C.surface, borderRadius: R.md, marginBottom: 12,
              border: '1px solid ' + (isPreviewing ? C.ink : C.line),
              overflow: 'hidden', transition: 'border-color .15s',
            }}>
              <div style={{ padding: '16px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>

                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: F.large, fontWeight: 800, color: C.ink }}>{sim.name}</span>
                      <span style={{
                        fontSize: F.xs, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: C.panel, color: C.text, border: '1px solid ' + C.line,
                      }} title={`גרסה ${sim.version}`}>v{sim.version}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: F.small, color: C.textDim, flexWrap: 'wrap' }}>
                      <span>אזור: {sim.area_label}</span>
                      {sim.zone_type && <span>{sim.zone_type}</span>}
                      <span title="תאריך שמירה אחרונה">עודכן: {fmtDate(sim.updated_at)}</span>
                    </div>
                  </div>

                  {sim.results && sim.results.length > 0 && (
                    <div style={{ display: 'flex', gap: 22 }}>
                      <div style={{ textAlign: 'center' }} title="סך שטח בנוי">
                        <div style={{ fontSize: F.large, fontWeight: 800, color: C.ink }}>{Math.round(built).toLocaleString()}</div>
                        <div style={{ fontSize: F.xs, color: C.mute }}>מ"ר בנוי</div>
                      </div>
                      <div style={{ textAlign: 'center' }} title="סך שטח קרקע">
                        <div style={{ fontSize: F.large, fontWeight: 800, color: C.ink }}>{land.toFixed(1)}</div>
                        <div style={{ fontSize: F.xs, color: C.mute }}>דונם קרקע</div>
                      </div>
                      <div style={{ textAlign: 'center' }} title="סך תושבים">
                        <div style={{ fontSize: F.large, fontWeight: 800, color: C.ink }}>{sim.zone?.pop?.total?.toLocaleString() ?? '—'}</div>
                        <div style={{ fontSize: F.xs, color: C.mute }}>תושבים</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    {sim.results?.length > 0 && (
                      <button onClick={() => togglePreview(sim.id)} style={{
                        ...BTN_GHOST,
                        borderColor: isPreviewing ? C.ink : C.line,
                        background: isPreviewing ? C.panel : C.surface,
                      }} title="הצג תצוגה מקדימה של התוצאות">{isPreviewing ? '▲ הסתר' : '▼ תצוגה מקדימה'}</button>
                    )}
                    <button onClick={() => onOpen(sim)} style={BTN_PRIMARY} title="פתח את תוצאות החישוב">פתח תוצאות</button>
                    <button onClick={() => onEdit(sim)} style={BTN_GHOST} title="ערוך פרופיל אוכלוסייה">ערוך</button>
                    <button onClick={() => onCopy(sim)} style={BTN_GHOST} title="צור עותק חדש">שכפל</button>
                    {isConfirm ? (
                      <>
                        <span style={{ fontSize: F.small, color: C.ink, fontWeight: 700 }}>מחק?</span>
                        <button onClick={() => { onDelete(sim.id); setDeleteConfirm(null); }} style={BTN_PRIMARY}>כן, מחק</button>
                        <button onClick={() => setDeleteConfirm(null)} style={BTN_GHOST}>ביטול</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(sim.id)} style={{ ...BTN_GHOST, padding: '8px 12px' }} title="מחק סימולציה">🗑</button>
                    )}
                  </div>
                </div>
              </div>
              {isPreviewing && (
                <>
                  <ResultsPreview results={sim.results} />
                  <div style={{ padding: '12px 22px', borderTop: '1px solid ' + C.line, background: C.panel, textAlign: 'left' }}>
                    <button onClick={() => setModalSim(sim)} style={BTN_PRIMARY} title="פתח תצוגה מלאה עם פירוט חישובים">
                      פתח חישוב מלא עם פירוט
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {list.length === 0 && Object.keys(sims).length > 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: C.mute, fontSize: F.base }}>
            לא נמצאו סימולציות עבור "{search}"
          </div>
        )}
      </div>
    </div>
    </>
  );
}
