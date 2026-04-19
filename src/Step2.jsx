import { useState, useMemo } from 'react';
import WizardSteps from './WizardSteps';

const BUILT_META = {
  megurim:       { label: 'מגורים',     color: '#3b82f6' },
  mischar:       { label: 'מסחר',       color: '#f59e0b' },
  mivney_tzibur: { label: 'מבני ציבור', color: '#8b5cf6' },
  taasuka:       { label: 'תעסוקה',    color: '#10b981' },
  chanaya:       { label: 'חנייה',      color: '#94a3b8' },
};

const LU_META = {
  residential: { label: 'מגורים',   color: '#3b82f6' },
  commercial:  { label: 'מסחר',     color: '#f59e0b' },
  institution: { label: 'מוסדות',  color: '#8b5cf6' },
  industrial:  { label: 'תעשייה',  color: '#ef4444' },
  parking:     { label: 'חנייה',    color: '#94a3b8' },
};

// Fields the user edits directly; total and age_0_6 are derived from these
const AGE_FIELDS = [
  { key: 'age_0_1',    label: 'תינוקות 0–1',   color: '#6366f1', note: 'בסיס: טיפת חלב' },
  { key: 'age_0_3',    label: 'ילדים 0–3',      color: '#818cf8', note: 'בסיס: מעונות יום' },
  { key: 'age_3_6',    label: 'ילדים 3–6',      color: '#3b82f6', note: 'בסיס: גנים' },
  { key: 'age_1_6',    label: 'ילדים 1–6',      color: '#60a5fa', note: 'בסיס: טיפת חלב' },
  { key: 'age_6_12',   label: 'ילדים 6–12',     color: '#06b6d4', note: 'בסיס: יסודי' },
  { key: 'age_11_18',  label: 'נוער 11–18',     color: '#0891b2', note: 'בסיס: מועדון נוער' },
  { key: 'age_12_18',  label: 'נוער 12–18',     color: '#0284c7', note: 'בסיס: על-יסודי' },
  { key: 'age_18_45',  label: 'בוגרים 18–45',   color: '#10b981', note: '' },
  { key: 'age_45_70',  label: 'מבוגרים 45–70',  color: '#f59e0b', note: '' },
  { key: 'age_70_plus', label: 'קשישים 70+',    color: '#ef4444', note: 'בסיס: מועדון קשישים, רווחה' },
];

// Non-overlapping cohorts used to compute total
const TOTAL_KEYS = ['age_0_3', 'age_3_6', 'age_6_12', 'age_12_18', 'age_18_45', 'age_45_70', 'age_70_plus'];

function AgeRow({ field, value, onChange, readOnly, total }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 88px 1fr 44px',
      alignItems: 'center', gap: 10, marginBottom: 9,
    }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: readOnly ? '#94a3b8' : '#374151' }}>
          {field.label}
        </div>
        {field.note && (
          <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 1 }}>{field.note}</div>
        )}
      </div>
      <input
        type="number" min={0} value={value}
        readOnly={readOnly}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        style={{
          width: '100%', padding: '6px 10px', borderRadius: 7,
          textAlign: 'center', fontSize: 14, fontWeight: 700,
          border: readOnly ? '1px solid #f1f5f9' : '1.5px solid #e2e8f0',
          background: readOnly ? '#f8fafc' : '#fff',
          color: readOnly ? '#94a3b8' : '#1e293b',
          outline: 'none', fontFamily: 'inherit', cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = '#2563eb'; }}
        onBlur={e => { if (!readOnly) e.target.style.borderColor = '#e2e8f0'; }}
      />
      <div style={{ height: 11, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: readOnly ? '#e2e8f0' : field.color,
          borderRadius: 5, transition: 'width .25s',
        }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: readOnly ? '#d1d5db' : field.color }}>
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

function MetricInput({ label, value, onChange, unit, step = 1, min = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number" min={min} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: 96, padding: '7px 10px', borderRadius: 7, textAlign: 'center',
            fontSize: 14, fontWeight: 700, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#1e293b', outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = '#2563eb')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{unit}</span>
      </div>
    </div>
  );
}

export default function Step2({ zone, onBack, onContinue }) {
  // Editable state — initialized from the zone
  const [pop, setPop] = useState({ ...zone.pop });
  const [housingUnits, setHousingUnits] = useState(zone.housing_units);
  const [hhSize, setHhSize] = useState(zone.hh_size);
  const [mmPct, setMmPct] = useState(zone.mm_pct);

  const setPopField = (key, val) => setPop(p => ({ ...p, [key]: val }));

  // Derive total and age_0_6 from the editable cohorts
  const derivedTotal = useMemo(
    () => TOTAL_KEYS.reduce((s, k) => s + (pop[k] || 0), 0),
    [pop]
  );
  const derivedAge0_6 = (pop.age_0_3 || 0) + (pop.age_3_6 || 0);

  const handleContinue = () => {
    const editedZone = {
      ...zone,
      housing_units: housingUnits,
      hh_size: hhSize,
      mm_pct: mmPct,
      pop: {
        ...pop,
        total:    derivedTotal,
        age_0_6:  derivedAge0_6,
      },
    };
    onContinue(editedZone);
  };

  const typeBg    = zone.type === 'neighborhood' ? '#dbeafe' : zone.type === 'census_tract' ? '#dcfce7' : '#fef9c3';
  const typeColor = zone.type === 'neighborhood' ? '#1d4ed8' : zone.type === 'census_tract' ? '#15803d' : '#92400e';

  const maxBuilt = Math.max(...Object.values(zone.built), 1);

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", minHeight: '100vh', background: '#f0f4f8', padding: '24px 16px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        {/* Wizard header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <WizardSteps current={2} />
          <button onClick={onBack} style={{
            padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 600,
          }}>← חזרה</button>
        </div>

        {/* Zone header */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '18px 24px', marginBottom: 18,
          border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f', margin: 0 }}>{zone.name}</h2>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: typeBg, color: typeColor, border: `1px solid ${typeColor}30`,
            }}>{zone.type_heb}</span>
          </div>
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
            <span>קוד: <strong style={{ color: '#1e3a5f' }}>{zone.code}</strong></span>
            <span>רובע: <strong style={{ color: '#1e3a5f' }}>{zone.rova}</strong></span>
          </div>
        </div>

        {/* Population form */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 18,
          border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          {/* Section title + total */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>👥</span> נתוני אוכלוסייה
              <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8', marginRight: 4 }}>
                (ערכים ניתנים לעריכה)
              </span>
            </div>
            <div style={{
              background: '#eff6ff', borderRadius: 8, padding: '6px 14px',
              fontSize: 13, fontWeight: 800, color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}>
              סה"כ: {derivedTotal.toLocaleString()} תושבים
              {derivedTotal !== zone.pop.total && (
                <span style={{ fontSize: 10, color: '#60a5fa', marginRight: 6 }}>
                  (מקורי: {zone.pop.total.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* Two-column grid of age rows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
            {AGE_FIELDS.map(f => (
              <AgeRow
                key={f.key}
                field={f}
                value={pop[f.key] || 0}
                onChange={v => setPopField(f.key, v)}
                readOnly={false}
                total={derivedTotal}
              />
            ))}
            {/* Derived row */}
            <AgeRow
              field={{ key: 'age_0_6', label: 'ילדים 0–6', color: '#a5b4fc', note: 'מחושב: 0–3 + 3–6' }}
              value={derivedAge0_6}
              onChange={() => {}}
              readOnly={true}
              total={derivedTotal}
            />
          </div>
        </div>

        {/* Key metrics */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '18px 24px', marginBottom: 18,
          border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏠</span> נתוני דיור
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <MetricInput label='יחידות דיור (יח"ד)' value={housingUnits} onChange={setHousingUnits} unit='יח"ד' />
            <MetricInput label='גודל משפחה' value={hhSize} onChange={setHhSize} unit='נפש/יח"ד' step={0.1} min={0} />
            <MetricInput label='% ממלכתי' value={mmPct} onChange={setMmPct} unit='%' step={0.1} min={0} />
          </div>
        </div>

        {/* Built areas — read-only */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '18px 24px', marginBottom: 18,
          border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏗️</span> שטחים בנויים (מ"ר) — נתוני בסיס
          </div>
          {Object.entries(zone.built).map(([k, v]) => {
            const m = BUILT_META[k] || { label: k, color: '#94a3b8' };
            const pct = maxBuilt > 0 ? (v / maxBuilt) * 100 : 0;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <div style={{ width: 88, fontSize: 11, color: '#64748b', textAlign: 'right' }}>{m.label}</div>
                <div style={{ flex: 1, height: 11, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: m.color, opacity: 0.6, borderRadius: 4 }} />
                </div>
                <div style={{ width: 72, fontSize: 11, fontWeight: 700, color: m.color }}>{v.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        {/* Land use — read-only */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '18px 24px', marginBottom: 24,
          border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🗺️</span> ייעוד קרקע
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
            {Object.entries(zone.land_use).filter(([, v]) => v > 0).map(([k, pct]) => {
              const m = LU_META[k] || { label: k, color: '#94a3b8' };
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: m.color }} />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{pct}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden' }}>
            {Object.entries(zone.land_use).filter(([, v]) => v > 0).map(([k, pct]) => {
              const m = LU_META[k] || { label: k, color: '#94a3b8' };
              return <div key={k} title={`${m.label}: ${pct}%`}
                style={{ width: `${pct}%`, background: m.color, opacity: 0.8 }} />;
            })}
          </div>
        </div>

        {/* Continue */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
          {derivedTotal !== zone.pop.total && (
            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              ⚠ נתונים שונו מהמקור — החישוב ישקף את הערכים המעודכנים
            </span>
          )}
          <button onClick={handleContinue} style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(37,99,235,.3)',
          }}>
            המשך לחישוב ←
          </button>
        </div>

      </div>
    </div>
  );
}
