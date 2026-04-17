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

const AGE_COHORTS = [
  { key: 'age_0_6',    label: '0–6 (טרום)',    color: '#6366f1' },
  { key: 'age_6_12',   label: '6–12 (יסודי)',  color: '#3b82f6' },
  { key: 'age_12_18',  label: '12–18 (על-יס)', color: '#06b6d4' },
  { key: 'age_18_45',  label: '18–45',          color: '#10b981' },
  { key: 'age_45_70',  label: '45–70',          color: '#f59e0b' },
  { key: 'age_70_plus', label: '70+',           color: '#ef4444' },
];

function HBar({ value, max, color, label }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{ width: 88, fontSize: 11, color: '#64748b', flexShrink: 0, textAlign: 'right' }}>{label}</div>
      <div style={{ flex: 1, height: 13, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <div style={{ width: 56, fontSize: 11, fontWeight: 700, color, textAlign: 'left', flexShrink: 0 }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '18px 20px',
      border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ icon, text }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>{icon}</span>{text}
    </div>
  );
}

export default function Step2({ zone, onBack, onContinue }) {
  const { pop, built, land_use } = zone;
  const maxBuilt = Math.max(...Object.values(built), 1);
  const typeBg    = zone.type === 'neighborhood' ? '#dbeafe' : zone.type === 'census_tract' ? '#dcfce7' : '#fef9c3';
  const typeColor = zone.type === 'neighborhood' ? '#1d4ed8' : zone.type === 'census_tract' ? '#15803d' : '#92400e';

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
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f', margin: 0 }}>{zone.name}</h2>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: typeBg, color: typeColor, border: `1px solid ${typeColor}30`,
                }}>{zone.type_heb}</span>
              </div>
              <div style={{ display: 'flex', gap: 18, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
                <span>קוד: <strong style={{ color: '#1e3a5f' }}>{zone.code}</strong></span>
                <span>רובע: <strong style={{ color: '#1e3a5f' }}>{zone.rova}</strong></span>
                {pop.total > 0 && <span>אוכלוסייה: <strong style={{ color: '#1e3a5f' }}>{pop.total.toLocaleString()}</strong> תושבים</span>}
                {zone.housing_units > 0 && <span>יח"ד: <strong style={{ color: '#1e3a5f' }}>{zone.housing_units.toLocaleString()}</strong></span>}
                {zone.mm_pct > 0 && <span>ממלכתי: <strong style={{ color: '#1e3a5f' }}>{zone.mm_pct}%</strong></span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Two column: population + built */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Population */}
          <Card>
            <CardTitle icon="👥" text="פילוח אוכלוסייה לפי גיל" />
            {pop.total > 0 ? (
              <>
                {AGE_COHORTS.map(c => (
                  <HBar key={c.key} value={pop[c.key] || 0} max={pop.total} color={c.color} label={c.label} />
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                  {[
                    { label: 'גודל משפחה',   value: zone.hh_size > 0 ? `${zone.hh_size}` : '—', unit: 'נפש/יח"ד' },
                    { label: 'יחידות דיור',  value: zone.housing_units > 0 ? zone.housing_units.toLocaleString() : '—', unit: 'יח"ד' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#1e3a5f' }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{m.unit}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>אין נתוני אוכלוסייה לאזור זה</div>
            )}
          </Card>

          {/* Built areas */}
          <Card>
            <CardTitle icon="🏗️" text='שטחים בנויים (מ"ר)' />
            {Object.entries(built).map(([k, v]) => {
              const m = BUILT_META[k] || { label: k, color: '#94a3b8' };
              return <HBar key={k} value={v} max={maxBuilt} color={m.color} label={m.label} />;
            })}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
              <span>סה"כ בנוי:</span>
              <strong style={{ color: '#475569' }}>{Object.values(built).reduce((a, b) => a + b, 0).toLocaleString()} מ"ר</strong>
            </div>
          </Card>
        </div>

        {/* Land use */}
        <Card style={{ marginBottom: 24 }}>
          <CardTitle icon="🗺️" text="ייעוד קרקע" />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.entries(land_use).filter(([, v]) => v > 0).map(([k, pct]) => {
              const m = LU_META[k] || { label: k, color: '#94a3b8' };
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: m.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{pct}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden' }}>
            {Object.entries(land_use).filter(([, v]) => v > 0).map(([k, pct]) => {
              const m = LU_META[k] || { label: k, color: '#94a3b8' };
              return (
                <div key={k} title={`${m.label}: ${pct}%`}
                  style={{ width: `${pct}%`, background: m.color, opacity: 0.85 }} />
              );
            })}
          </div>
        </Card>

        {/* Continue */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onContinue} style={{
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
