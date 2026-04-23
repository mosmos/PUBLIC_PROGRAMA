import { useState } from 'react';
import WizardSteps from './WizardSteps';
import { C, F, R } from './theme';

const BTN_BASE = {
  padding: '8px 16px', borderRadius: R.md, fontSize: F.base,
  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
  border: '1px solid ' + C.line, background: C.surface, color: C.ink,
  whiteSpace: 'nowrap',
};
const BTN_PRIMARY = {
  ...BTN_BASE,
  background: C.accent, border: '1px solid ' + C.accent,
  color: C.surface, fontWeight: 700,
};

export default function TopBar({
  step, zone, currentSimId, onBack, onCatalog, onRestart, onContinue, onSave, onSaveCopy,
}) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [simName, setSimName] = useState(zone?.name || '');
  const [saved, setSaved] = useState(null);

  const handleSave = () => {
    onSave(simName);
    setSaved('saved');
    setSaveOpen(false);
    setTimeout(() => setSaved(null), 3500);
  };
  const handleCopy = () => {
    onSaveCopy(simName);
    setSaved('copy');
    setSaveOpen(false);
    setTimeout(() => setSaved(null), 3500);
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div dir="rtl" style={{
        background: C.surface,
        borderBottom: '1px solid ' + C.line,
        padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        height: 58,
      }}>
        <span style={{ fontSize: F.large, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap', flexShrink: 0 }}>
          פרוגרמה
        </span>

        {zone && (
          <span style={{
            background: C.panel, color: C.text, fontSize: F.small,
            fontWeight: 600, padding: '4px 12px', borderRadius: 20,
            border: '1px solid ' + C.line, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {zone.name}
          </span>
        )}

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <WizardSteps current={step} compact />
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={onCatalog} style={BTN_BASE} title="רשימת כל הסימולציות השמורות">קטלוג</button>

          {step === 1 && (
            <button
              onClick={onContinue || undefined}
              disabled={!onContinue}
              style={{
                ...BTN_PRIMARY,
                opacity: onContinue ? 1 : 0.35,
                cursor: onContinue ? 'pointer' : 'not-allowed',
              }}
              title={onContinue ? 'המשך להזנת נתוני אוכלוסייה' : 'בחר אזור כדי להמשיך'}
            >המשך לפרופיל אוכלוסייה ←</button>
          )}

          {step === 2 && onBack && <button onClick={onBack} style={BTN_BASE}>← חזרה</button>}
          {step === 2 && onContinue && <button onClick={onContinue} style={BTN_PRIMARY}>המשך לחישוב ←</button>}

          {step === 3 && onBack && <button onClick={onBack} style={BTN_BASE}>← חזרה לפרופיל</button>}
          {step === 3 && onRestart && <button onClick={onRestart} style={BTN_BASE} title="התחל מחדש עם אזור אחר">בחר אזור אחר</button>}
          {step === 3 && onSave && (
            <button
              onClick={() => { setSaveOpen(o => !o); setSaved(null); }}
              style={BTN_PRIMARY}
              title={currentSimId ? 'שמור גרסה חדשה של הסימולציה' : 'שמור סימולציה חדשה'}
            >
              {saved === 'saved' ? 'נשמר ✓' : saved === 'copy' ? 'עותק נשמר ✓' : currentSimId ? 'שמור גרסה' : 'שמור'}
            </button>
          )}
          {step === 3 && onSaveCopy && currentSimId && (
            <button onClick={() => { setSaveOpen(o => !o); setSaved(null); }} style={BTN_BASE} title="שמור כעותק חדש">
              שמור עותק
            </button>
          )}
        </div>
      </div>

      {step === 3 && saveOpen && (
        <div dir="rtl" style={{
          background: C.surface, borderBottom: '1px solid ' + C.line,
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: F.base, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>שם הסימולציה:</span>
          <input
            type="text"
            value={simName}
            onChange={e => setSimName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaveOpen(false); }}
            autoFocus
            style={{
              flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: R.sm,
              border: '1px solid ' + C.ink, fontSize: F.base, outline: 'none',
              fontFamily: 'inherit', color: C.ink,
            }}
          />
          <button onClick={handleSave} disabled={!simName.trim()} style={{
            ...BTN_PRIMARY,
            opacity: simName.trim() ? 1 : 0.4,
            cursor: simName.trim() ? 'pointer' : 'not-allowed',
          }}>
            {currentSimId ? 'שמור גרסה' : 'שמור'}
          </button>
          <button onClick={handleCopy} disabled={!simName.trim()} style={{
            ...BTN_BASE,
            opacity: simName.trim() ? 1 : 0.4,
            cursor: simName.trim() ? 'pointer' : 'not-allowed',
          }}>שמור עותק</button>
          <button onClick={() => setSaveOpen(false)} style={{ ...BTN_BASE, color: C.mute }}>ביטול</button>
        </div>
      )}
    </div>
  );
}
