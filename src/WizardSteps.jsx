import { C, F } from './theme';

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
              width: compact ? 24 : 40,
              borderTop: `1.5px ${s.n <= current ? 'solid ' + C.ink : 'dashed ' + C.line}`,
              margin: `0 ${compact ? 6 : 8}px`, flexShrink: 0,
            }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 9 }}>
            <div style={{
              width: compact ? 26 : 32, height: compact ? 26 : 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: compact ? F.xs : F.small, fontWeight: 800, flexShrink: 0,
              background: s.n === current ? C.ink : s.n < current ? C.text : C.lineSoft,
              color: s.n <= current ? C.surface : C.mute,
              border: s.n === current ? '2px solid ' + C.ink : '1px solid ' + C.line,
            }}>
              {s.n < current ? '✓' : s.n}
            </div>
            {!compact && (
              <span style={{
                fontSize: F.base, fontWeight: s.n === current ? 700 : 500,
                color: s.n === current ? C.ink : s.n < current ? C.text : C.mute,
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
