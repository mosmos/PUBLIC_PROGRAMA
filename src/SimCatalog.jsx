import { useState, useMemo } from 'react';
import { buildContext } from './calcEngine';
import { CAT_META, fmt, DrillDownPanel } from './DrillDownPanel';


function FullModal({ sim, onClose }) {
  const [openDrill, setOpenDrill] = useState(null);
  const ctx = useMemo(() => sim.zone ? buildContext(sim.zone) : null, [sim]);

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
      background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 12px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div dir="rtl" style={{
        background: '#f0f4f8', borderRadius: 16, width: '100%', maxWidth: 860,
        fontFamily: "'Segoe UI', Arial, sans-serif", boxShadow: '0 24px 60px rgba(0,0,0,.25)',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{sim.name}</div>
            <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>
              {sim.area_label} · v{sim.version} ·{' '}
              <span style={{ marginRight: 12 }}>בנוי: {Math.round(totalBuilt).toLocaleString()} מ"ר</span>
              <span>קרקע: {totalLand.toFixed(1)} דונם</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 16, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ סגור</button>
        </div>

        {/* Results */}
        <div style={{ padding: '16px' }}>
          {Object.entries(grouped).map(([cat, rows]) => {
            const meta = CAT_META[cat] || { color: '#94a3b8', bg: '#f8fafc', icon: '📋', label: cat };
            const catBuilt = rows.reduce((s, r) => s + (typeof r.built_sqm  === 'number' ? r.built_sqm  : 0), 0);
            const catLand  = rows.reduce((s, r) => s + (typeof r.land_dunam === 'number' ? r.land_dunam : 0), 0);
            return (
              <div key={cat} style={{
                background: '#fff', borderRadius: 12, marginBottom: 12,
                border: `1.5px solid ${meta.color}35`, overflow: 'hidden',
              }}>
                <div style={{
                  background: meta.bg, padding: '10px 16px',
                  borderBottom: `1.5px solid ${meta.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{meta.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 14 }}>
                    {catBuilt > 0 && <span>בנוי: <strong style={{ color: meta.color }}>{Math.round(catBuilt).toLocaleString()} מ"ר</strong></span>}
                    {catLand  > 0 && <span>קרקע: <strong style={{ color: meta.color }}>{catLand.toFixed(1)} דונם</strong></span>}
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {rows.map((r, i) => {
                      const key = `${cat}-${i}`;
                      const isOpen = openDrill === key;
                      return (
                        <>
                          <tr key={key}
                            onClick={() => setOpenDrill(prev => prev === key ? null : key)}
                            style={{
                              borderBottom: isOpen ? 'none' : '1px solid #f1f5f9',
                              background: isOpen ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa',
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ padding: '9px 16px', fontWeight: 600, color: isOpen ? '#1d4ed8' : '#1e293b' }}>
                              {r.service}
                            </td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, color: meta.color, minWidth: 70 }}>
                              {fmt(r.required_units, 0)}
                            </td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', color: '#475569', minWidth: 90 }}>
                              {fmt(r.built_sqm)} מ"ר
                            </td>
                            <td style={{ padding: '9px 14px', textAlign: 'center', color: '#475569', minWidth: 80 }}>
                              {fmt(r.land_dunam)} ד'
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', width: 32 }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 20, height: 20, borderRadius: 5,
                                background: isOpen ? '#2563eb' : '#e2e8f0',
                                color: isOpen ? '#fff' : '#94a3b8', fontSize: 9, fontWeight: 700,
                              }}>{isOpen ? '▲' : '▼'}</span>
                            </td>
                          </tr>
                          {isOpen && ctx && (
                            <DrillDownPanel key={`dd-${key}`} r={r} ctx={ctx} meta={meta} />
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

  if (!results || results.length === 0) {
    return <div style={{ padding: '16px 20px', color: '#94a3b8', fontSize: 13 }}>אין תוצאות שמורות</div>;
  }

  return (
    <div style={{ borderTop: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '14px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>סיכום תוצאות לפי קטגוריה</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(grouped).map(([cat, data]) => {
          const meta = CAT_META[cat] || { icon: '📌', label: cat, color: '#64748b' };
          const barPct = totalBuilt > 0 ? (data.built / totalBuilt) * 100 : 0;
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, width: 20, flexShrink: 0 }}>{meta.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', width: 110, flexShrink: 0 }}>{meta.label}</span>
              {/* bar */}
              <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
                <div style={{ width: `${barPct}%`, height: '100%', background: meta.color, borderRadius: 4, transition: 'width .4s' }} />
              </div>
              <span style={{ fontSize: 11, color: '#475569', width: 72, textAlign: 'left', flexShrink: 0 }}>
                {Math.round(data.built).toLocaleString()} מ"ר
              </span>
              <span style={{ fontSize: 11, color: '#64748b', width: 64, textAlign: 'left', flexShrink: 0 }}>
                {data.land > 0 ? `${data.land.toFixed(1)} ד'` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_BADGE = {
  draft:     { label: 'טיוטה',     bg: '#dbeafe', color: '#1d4ed8' },
  saved:     { label: 'נשמר',      bg: '#dcfce7', color: '#15803d' },
  copy:      { label: 'עותק',      bg: '#fef9c3', color: '#92400e' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function EmptyState({ onNew }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: '#94a3b8' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#475569', marginBottom: 8 }}>אין סימולציות שמורות</div>
      <div style={{ fontSize: 14, marginBottom: 24 }}>צור סימולציה חדשה כדי להתחיל</div>
      <button onClick={onNew} style={{
        padding: '11px 28px', borderRadius: 9, border: 'none',
        background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit',
      }}>+ סימולציה חדשה</button>
    </div>
  );
}

export default function SimCatalog({ sims, onNew, onOpen, onEdit, onCopy, onDelete }) {
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(null);
  const [modalSim, setModalSim] = useState(null);

  const togglePreview = (id) => setPreviewOpen(p => p === id ? null : id);

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
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", minHeight: '100vh', background: '#f0f4f8', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e3a5f', margin: 0 }}>קטלוג סימולציות</h1>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>
              {list.length} סימולציות {search ? 'תואמות' : 'שמורות'}
            </div>
          </div>
          <button onClick={onNew} style={{
            padding: '10px 24px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(37,99,235,.25)',
          }}>+ סימולציה חדשה</button>
        </div>

        {/* Search */}
        {Object.keys(sims).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <input
              type="text"
              placeholder="חיפוש לפי שם או אזור..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 9,
                border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', background: '#fff', color: '#1e293b',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#2563eb')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>
        )}

        {/* Empty state */}
        {Object.keys(sims).length === 0 && <EmptyState onNew={onNew} />}

        {/* Simulation cards */}
        {list.map(sim => {
          const built = totalBuilt(sim);
          const land = totalLand(sim);
          const isConfirm = deleteConfirm === sim.id;
          const isPreviewing = previewOpen === sim.id;
          return (
            <div key={sim.id} style={{
              background: '#fff', borderRadius: 12, marginBottom: 12,
              border: `1.5px solid ${isPreviewing ? '#2563eb' : '#e2e8f0'}`,
              boxShadow: isPreviewing ? '0 2px 12px rgba(37,99,235,.12)' : '0 1px 4px rgba(0,0,0,.05)',
              overflow: 'hidden', transition: 'border-color .15s, box-shadow .15s',
            }}>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>

                  {/* Left: name + meta */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#1e3a5f' }}>{sim.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: STATUS_BADGE.saved.bg, color: STATUS_BADGE.saved.color,
                      }}>v{sim.version}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                      <span>📍 {sim.area_label}</span>
                      {sim.zone_type && <span>{sim.zone_type}</span>}
                      <span>🕐 {fmtDate(sim.updated_at)}</span>
                    </div>
                  </div>

                  {/* Middle: result KPIs */}
                  {sim.results && sim.results.length > 0 && (
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f' }}>{Math.round(built).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>מ"ר בנוי</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f' }}>{land.toFixed(1)}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>דונם קרקע</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f' }}>{sim.zone?.pop?.total?.toLocaleString() ?? '—'}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>תושבים</div>
                      </div>
                    </div>
                  )}

                  {/* Right: action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    {sim.results?.length > 0 && (
                      <button onClick={() => togglePreview(sim.id)} style={{
                        padding: '7px 12px', borderRadius: 7,
                        border: `1.5px solid ${isPreviewing ? '#2563eb' : '#e2e8f0'}`,
                        background: isPreviewing ? '#eff6ff' : '#fff',
                        color: isPreviewing ? '#2563eb' : '#64748b',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>{isPreviewing ? '▲ הסתר' : '▼ תצוגה מקדימה'}</button>
                    )}
                    <button onClick={() => onOpen(sim)} style={{
                      padding: '7px 14px', borderRadius: 7, border: 'none',
                      background: '#2563eb', color: '#fff', fontSize: 12,
                      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>פתח תוצאות</button>
                    <button onClick={() => onEdit(sim)} style={{
                      padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0',
                      background: '#fff', color: '#475569', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>ערוך</button>
                    <button onClick={() => onCopy(sim)} style={{
                      padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0',
                      background: '#fff', color: '#475569', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>שכפל</button>
                    {isConfirm ? (
                      <>
                        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>מחק?</span>
                        <button onClick={() => { onDelete(sim.id); setDeleteConfirm(null); }} style={{
                          padding: '6px 12px', borderRadius: 7, border: 'none',
                          background: '#dc2626', color: '#fff', fontSize: 11,
                          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}>כן, מחק</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{
                          padding: '6px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0',
                          background: '#fff', color: '#64748b', fontSize: 11,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>ביטול</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(sim.id)} style={{
                        padding: '7px 10px', borderRadius: 7, border: '1.5px solid #fecaca',
                        background: '#fff', color: '#dc2626', fontSize: 12,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
              {isPreviewing && (
                <>
                  <ResultsPreview results={sim.results} />
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'left' }}>
                    <button onClick={() => setModalSim(sim)} style={{
                      padding: '7px 16px', borderRadius: 7, border: 'none',
                      background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                      color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>🔍 פתח חישוב מלא עם פירוט</button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {list.length === 0 && Object.keys(sims).length > 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            לא נמצאו סימולציות עבור "{search}"
          </div>
        )}
      </div>
    </div>
    </>
  );
}
