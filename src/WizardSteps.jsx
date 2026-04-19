const STEPS = [
  { n: 1, label: 'בחירת אזור' },
  { n: 2, label: 'פרופיל אזור' },
  { n: 3, label: 'תוצאות חישוב' },
];

export default function WizardSteps({ current, compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', direction: 'rtl' }}>
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && (
            <div style={{
              width: compact ? 20 : 32,
              borderTop: `1.5px ${s.n <= current ? 'solid #2563eb' : 'dashed #d1d5db'}`,
              margin: `0 ${compact ? 4 : 6}px`, flexShrink: 0,
            }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 7 }}>
            <div style={{
              width: compact ? 24 : 30, height: compact ? 24 : 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: compact ? 11 : 12, fontWeight: 800, flexShrink: 0,
              background: s.n < current ? '#10b981' : s.n === current ? '#2563eb' : '#e2e8f0',
              color: s.n <= current ? '#fff' : '#94a3b8',
              boxShadow: s.n === current ? '0 0 0 3px #bfdbfe' : 'none',
              transition: 'all .2s',
            }}>
              {s.n < current ? '✓' : s.n}
            </div>
            {!compact && (
              <span style={{
                fontSize: 13, fontWeight: s.n === current ? 700 : 500,
                color: s.n === current ? '#1e3a5f' : s.n < current ? '#059669' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
