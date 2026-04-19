import { useState } from 'react';
import WizardSteps from './WizardSteps';

const BTN_BASE = {
  padding: '7px 15px', borderRadius: 8, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
  border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569',
  whiteSpace: 'nowrap',
};
const BTN_PRIMARY = {
  ...BTN_BASE,
  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
  border: 'none', color: '#fff',
  boxShadow: '0 2px 6px rgba(37,99,235,.25)',
};

export default function TopBar({
  step,           // 1 | 2 | 3
  zone,           // zone object (may be null on step 1)
  currentSimId,   // string id or null
  onBack,         // () => void  — shown on step 2 and 3
  onCatalog,      // () => void
  onRestart,      // () => void  — shown on step 3
  onContinue,     // () => void  — shown on step 2
  onSave,         // (name) => void  — step 3
  onSaveCopy,     // (name) => void  — step 3
}) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [simName, setSimName] = useState(zone?.name || '');
  const [saved, setSaved] = useState(null); // 'saved' | 'copy'

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
      {/* Main bar */}
      <div dir="rtl" style={{
        background: '#fff',
        borderBottom: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,.07)',
        padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        height: 52,
      }}>
        {/* App name */}
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f', whiteSpace: 'nowrap', flexShrink: 0 }}>
          🏙️ פרוגרמה
        </span>

        {/* Zone badge */}
        {zone && (
          <span style={{
            background: '#eff6ff', color: '#1d4ed8', fontSize: 12,
            fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            border: '1px solid #bfdbfe', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {zone.name}
          </span>
        )}

        {/* Wizard steps — centered */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <WizardSteps current={step} compact />
        </div>

        {/* Right-side action buttons */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>

          {/* Catalog always visible */}
          <button onClick={onCatalog} style={BTN_BASE}>📋 קטלוג</button>

          {/* Step 1 — continue (disabled when no zone selected) */}
          {step === 1 && (
            <button
              onClick={onContinue || undefined}
              disabled={!onContinue}
              style={{
                ...BTN_PRIMARY,
                opacity: onContinue ? 1 : 0.4,
                cursor: onContinue ? 'pointer' : 'not-allowed',
              }}
            >המשך לפרופיל אוכלוסייה ←</button>
          )}

          {/* Step 2 — back + continue */}
          {step === 2 && onBack && (
            <button onClick={onBack} style={BTN_BASE}>← חזרה</button>
          )}
          {step === 2 && onContinue && (
            <button onClick={onContinue} style={BTN_PRIMARY}>המשך לחישוב ←</button>
          )}

          {/* Step 3 — back + new zone + save */}
          {step === 3 && onBack && (
            <button onClick={onBack} style={BTN_BASE}>← חזרה לפרופיל</button>
          )}
          {step === 3 && onRestart && (
            <button onClick={onRestart} style={BTN_BASE}>בחר אזור אחר</button>
          )}
          {step === 3 && onSave && (
            <button
              onClick={() => { setSaveOpen(o => !o); setSaved(null); }}
              style={{ ...BTN_PRIMARY, background: saved ? 'linear-gradient(135deg,#16a34a,#15803d)' : BTN_PRIMARY.background }}
            >
              {saved === 'saved' ? '✅ נשמר' : saved === 'copy' ? '✅ עותק נשמר' : currentSimId ? '💾 שמור גרסה' : '💾 שמור'}
            </button>
          )}
          {step === 3 && onSaveCopy && currentSimId && (
            <button onClick={() => { setSaveOpen(o => !o); setSaved(null); }} style={BTN_BASE}>
              שמור עותק
            </button>
          )}
        </div>
      </div>

      {/* Save dropdown panel */}
      {step === 3 && saveOpen && (
        <div dir="rtl" style={{
          background: '#fff', borderBottom: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,.1)',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>שם הסימולציה:</span>
          <input
            type="text"
            value={simName}
            onChange={e => setSimName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaveOpen(false); }}
            autoFocus
            style={{
              flex: 1, minWidth: 180, padding: '6px 12px', borderRadius: 7,
              border: '1.5px solid #2563eb', fontSize: 14, outline: 'none',
              fontFamily: 'inherit', color: '#1e293b',
            }}
          />
          <button onClick={handleSave} disabled={!simName.trim()} style={{
            ...BTN_PRIMARY,
            opacity: simName.trim() ? 1 : 0.45,
            cursor: simName.trim() ? 'pointer' : 'not-allowed',
          }}>
            {currentSimId ? 'שמור גרסה' : 'שמור'}
          </button>
          <button onClick={handleCopy} disabled={!simName.trim()} style={{
            ...BTN_BASE,
            opacity: simName.trim() ? 1 : 0.45,
            cursor: simName.trim() ? 'pointer' : 'not-allowed',
          }}>שמור עותק</button>
          <button onClick={() => setSaveOpen(false)} style={{ ...BTN_BASE, color: '#94a3b8' }}>ביטול</button>
        </div>
      )}
    </div>
  );
}
