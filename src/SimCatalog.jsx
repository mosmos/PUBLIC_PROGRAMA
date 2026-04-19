import { useState } from 'react';

const STATUS_BADGE = {
  draft:     { label: 'טיוטה',     bg: '#dbeafe', color: '#1d4ed8' },
  saved:     { label: 'נשמר',      bg: '#dcfce7', color: '#15803d' },
  copy:      { label: 'עותק',      bg: '#fef9c3', color: '#92400e' },
};

function fmt(iso) {
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
          return (
            <div key={sim.id} style={{
              background: '#fff', borderRadius: 12, marginBottom: 12,
              border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
              overflow: 'hidden',
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
                      <span>🕐 {fmt(sim.updated_at)}</span>
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
  );
}
