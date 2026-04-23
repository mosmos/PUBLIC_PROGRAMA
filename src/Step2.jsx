import { useState, useMemo } from 'react';
import TopBar from './TopBar';
import { C, F, R, FONT_FAMILY } from './theme';

const BUILT_META = {
  megurim:       { label: 'מגורים' },
  mischar:       { label: 'מסחר' },
  mivney_tzibur: { label: 'מבני ציבור' },
  taasuka:       { label: 'תעסוקה' },
  chanaya:       { label: 'חנייה' },
};

const LU_META = {
  residential: { label: 'מגורים' },
  commercial:  { label: 'מסחר' },
  institution: { label: 'מוסדות' },
  industrial:  { label: 'תעשייה' },
  parking:     { label: 'חנייה' },
};

const AGE_FIELDS = [
  { key: 'age_0_1',    label: 'תינוקות 0–1',  note: 'בסיס: טיפת חלב' },
  { key: 'age_0_3',    label: 'ילדים 0–3',    note: 'בסיס: מעונות יום' },
  { key: 'age_3_6',    label: 'ילדים 3–6',    note: 'בסיס: גנים' },
  { key: 'age_1_6',    label: 'ילדים 1–6',    note: 'בסיס: טיפת חלב' },
  { key: 'age_6_12',   label: 'ילדים 6–12',   note: 'בסיס: יסודי' },
  { key: 'age_11_18',  label: 'נוער 11–18',   note: 'בסיס: מועדון נוער' },
  { key: 'age_12_18',  label: 'נוער 12–18',   note: 'בסיס: על-יסודי' },
  { key: 'age_18_45',  label: 'בוגרים 18–45', note: '' },
  { key: 'age_45_70',  label: 'מבוגרים 45–70', note: '' },
  { key: 'age_70_plus', label: 'קשישים 70+',  note: 'בסיס: מועדון קשישים, רווחה' },
];

const TOTAL_KEYS = ['age_0_3', 'age_3_6', 'age_6_12', 'age_12_18', 'age_18_45', 'age_45_70', 'age_70_plus'];

function AgeRow({ field, value, onChange, readOnly, total }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '140px 100px 1fr 50px',
      alignItems: 'center', gap: 12, marginBottom: 10,
    }}>
      <div style={{ textAlign: 'right' }} title={field.note || undefined}>
        <div style={{ fontSize: F.base, fontWeight: 600, color: readOnly ? C.mute : C.ink }}>
          {field.label}
        </div>
        {field.note && (
          <div style={{ fontSize: F.xs, color: C.mute, marginTop: 1 }}>{field.note}</div>
        )}
      </div>
      <input
        type="number" min={0} value={value}
        readOnly={readOnly}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        title={readOnly ? 'שדה מחושב אוטומטית' : 'מספר תושבים בטווח הגילאים'}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: R.sm,
          textAlign: 'center', fontSize: F.base, fontWeight: 700,
          border: '1px solid ' + (readOnly ? C.lineSoft : C.line),
          background: readOnly ? C.panel : C.surface,
          color: readOnly ? C.mute : C.ink,
          outline: 'none', fontFamily: 'inherit', cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = C.ink; }}
        onBlur={e => { if (!readOnly) e.target.style.borderColor = C.line; }}
      />
      <div style={{ height: 10, background: C.lineSoft, borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: readOnly ? C.line : C.ink,
          borderRadius: 5, transition: 'width .25s',
        }} />
      </div>
      <div style={{ fontSize: F.xs, fontWeight: 700, color: readOnly ? C.mute : C.text, fontVariantNumeric: 'tabular-nums' }}>
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

function MetricInput({ label, value, onChange, unit, step = 1, min = 0, help }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: F.small, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 4 }}
        title={help}>
        {label}
        {help && <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, borderRadius: '50%', border: '1px solid ' + C.mute,
          color: C.textDim, fontSize: 10, fontWeight: 700, cursor: 'help',
        }}>?</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number" min={min} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: 110, padding: '8px 10px', borderRadius: R.sm, textAlign: 'center',
            fontSize: F.base, fontWeight: 700, border: '1px solid ' + C.line,
            background: C.surface, color: C.ink, outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = C.ink)}
          onBlur={e => (e.target.style.borderColor = C.line)}
        />
        <span style={{ fontSize: F.small, color: C.mute }}>{unit}</span>
      </div>
    </div>
  );
}

const SECTION = {
  background: C.surface,
  borderRadius: R.md,
  padding: '20px 24px',
  marginBottom: 18,
  border: '1px solid ' + C.line,
};

const SECTION_TITLE = {
  fontSize: F.large,
  fontWeight: 700,
  color: C.ink,
  marginBottom: 16,
};

export default function Step2({ zone, onBack, onContinue, onCatalog }) {
  const [pop, setPop] = useState({ ...zone.pop });
  const [housingUnits, setHousingUnits] = useState(zone.housing_units);
  const [hhSize, setHhSize] = useState(zone.hh_size);
  const [mmPct, setMmPct] = useState(zone.mm_pct);
  const [settlementType, setSettlementType] = useState(zone.settlement_type || 'B');
  const [harediPct, setHarediPct] = useState(zone.haredi_pct || 0);
  const [specialEdPct, setSpecialEdPct] = useState(zone.special_education_pct || 0);
  const [traditionalPct, setTraditionalPct] = useState(zone.traditional_pct || 0);
  const [age14_17, setAge14_17] = useState(zone.age_14_17 || 0);

  const setPopField = (key, val) => setPop(p => ({ ...p, [key]: val }));

  const derivedTotal = useMemo(
    () => TOTAL_KEYS.reduce((s, k) => s + (pop[k] || 0), 0),
    [pop]
  );
  const derivedAge0_6 = (pop.age_0_3 || 0) + (pop.age_3_6 || 0);

  const handleContinue = () => {
    const editedZone = {
      ...zone,
      housing_units: housingUnits, hh_size: hhSize, mm_pct: mmPct,
      settlement_type: settlementType,
      haredi_pct: harediPct, special_education_pct: specialEdPct,
      traditional_pct: traditionalPct, age_14_17: age14_17,
      pop: { ...pop, total: derivedTotal, age_0_6: derivedAge0_6 },
    };
    onContinue(editedZone);
  };

  const maxBuilt = Math.max(...Object.values(zone.built), 1);

  return (
    <div dir="rtl" style={{ fontFamily: FONT_FAMILY, minHeight: '100vh', background: C.bg }}>
      <TopBar
        step={2}
        zone={zone}
        onBack={onBack}
        onCatalog={onCatalog}
        onContinue={handleContinue}
      />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

        {/* Zone header */}
        <div style={SECTION}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontSize: F.h1, fontWeight: 800, color: C.ink, margin: 0 }}>{zone.name}</h2>
            <span style={{
              fontSize: F.xs, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
              background: C.panel, color: C.text, border: '1px solid ' + C.line,
            }}>{zone.type_heb}</span>
          </div>
          <div style={{ display: 'flex', gap: 22, fontSize: F.small, color: C.textDim, flexWrap: 'wrap' }}>
            <span>קוד: <strong style={{ color: C.ink }}>{zone.code}</strong></span>
            <span>רובע: <strong style={{ color: C.ink }}>{zone.rova}</strong></span>
          </div>
        </div>

        {/* Population form */}
        <div style={SECTION}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={SECTION_TITLE}>
              נתוני אוכלוסייה
              <span style={{ fontSize: F.xs, fontWeight: 400, color: C.mute, marginRight: 8 }} title="ערוך את מספר התושבים בכל קבוצת גיל — הסה״כ מחושב אוטומטית">
                (ערכים ניתנים לעריכה)
              </span>
            </div>
            <div style={{
              background: C.ink, color: C.surface, borderRadius: R.sm, padding: '8px 16px',
              fontSize: F.base, fontWeight: 800,
            }} title="סיכום כל קבוצות הגיל (ללא חפיפה)">
              סה"כ: {derivedTotal.toLocaleString()} תושבים
              {derivedTotal !== zone.pop.total && (
                <span style={{ fontSize: F.xs, color: '#cccccc', marginRight: 8 }}>
                  (מקורי: {zone.pop.total.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 36px' }}>
            {AGE_FIELDS.map(f => (
              <AgeRow key={f.key} field={f}
                value={pop[f.key] || 0}
                onChange={v => setPopField(f.key, v)}
                readOnly={false} total={derivedTotal} />
            ))}
            <AgeRow
              field={{ key: 'age_0_6', label: 'ילדים 0–6', note: 'מחושב: 0–3 + 3–6' }}
              value={derivedAge0_6}
              onChange={() => {}}
              readOnly={true}
              total={derivedTotal}
            />
          </div>
        </div>

        {/* Housing */}
        <div style={SECTION}>
          <div style={SECTION_TITLE}>נתוני דיור</div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <MetricInput label='יחידות דיור (יח"ד)' value={housingUnits} onChange={setHousingUnits} unit='יח"ד'
              help="מספר יחידות דיור מתוכננות באזור" />
            <MetricInput label='גודל משפחה' value={hhSize} onChange={setHhSize} unit='נפש/יח"ד' step={0.1}
              help="ממוצע נפשות במשק בית" />
            <MetricInput label='% ממלכתי' value={mmPct} onChange={setMmPct} unit='%' step={0.1}
              help="אחוז החינוך הממלכתי (לא דתי)" />
          </div>
        </div>

        {/* Extended demographics */}
        <div style={SECTION}>
          <div style={{ ...SECTION_TITLE, marginBottom: 6 }}>
            נתוני אוכלוסייה מורחבים
            <span style={{ fontSize: F.xs, fontWeight: 400, color: C.mute, marginRight: 8 }}>
              (מפעילים כללי פרוגרמה נוספים)
            </span>
          </div>
          <div style={{ fontSize: F.small, color: C.textDim, marginBottom: 16 }}>
            השאר ריק (0) אם לא רלוונטי — כללים מורחבים יופעלו רק כאשר הערך גדול מ-0
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: F.small, fontWeight: 700, color: C.text }} title="סוג היישוב משפיע על חלק מהכללים (צפיפות, מרחקי שירותים)">
                סוג יישוב
              </label>
              <select
                value={settlementType}
                onChange={e => setSettlementType(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: R.sm, border: '1px solid ' + C.line,
                  fontSize: F.base, fontWeight: 700, color: C.ink, background: C.surface,
                  outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                <option value="A">A — מרכז גדול</option>
                <option value="B">B — ממוצע</option>
                <option value="C">C — פריפריה</option>
              </select>
            </div>

            <MetricInput label="% חרדים" value={harediPct} onChange={setHarediPct} unit="%" step={0.1}
              help="אחוז אוכלוסייה חרדית — מפעיל כללי חינוך חרדי ודת" />
            <MetricInput label="% חינוך מיוחד" value={specialEdPct} onChange={setSpecialEdPct} unit="%" step={0.1}
              help="אחוז תלמידי חינוך מיוחד" />
            <MetricInput label="% מסורתיים" value={traditionalPct} onChange={setTraditionalPct} unit="%" step={0.1}
              help="אחוז אוכלוסייה מסורתית — מפעיל כללי דת" />
            <MetricInput label="נוער 14–17 (חינוך חרדי)" value={age14_17} onChange={setAge14_17} unit="תושבים" step={1}
              help="מספר נוער בגיל 14–17 המיועד לחינוך חרדי" />
          </div>
        </div>

        {/* Built areas — read-only */}
        <div style={SECTION}>
          <div style={SECTION_TITLE} title="שטחים בנויים קיימים לפי שימוש — נתוני קלט בלבד">
            שטחים בנויים (מ"ר) — נתוני בסיס
          </div>
          {Object.entries(zone.built).map(([k, v]) => {
            const m = BUILT_META[k] || { label: k };
            const pct = maxBuilt > 0 ? (v / maxBuilt) * 100 : 0;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 110, fontSize: F.small, color: C.text, textAlign: 'right' }}>{m.label}</div>
                <div style={{ flex: 1, height: 10, background: C.lineSoft, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: C.text, borderRadius: 4 }} />
                </div>
                <div style={{ width: 86, fontSize: F.small, fontWeight: 700, color: C.ink, textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>
                  {v.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Land use — read-only */}
        <div style={SECTION}>
          <div style={SECTION_TITLE} title="חלוקת שטח האזור לפי ייעוד">
            ייעוד קרקע
          </div>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.entries(zone.land_use).filter(([, v]) => v > 0).map(([k, pct]) => {
              const m = LU_META[k] || { label: k };
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: F.small, color: C.text }}>{m.label}</span>
                  <span style={{ fontSize: F.small, fontWeight: 700, color: C.ink }}>{pct}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', height: 16, borderRadius: R.sm, overflow: 'hidden', border: '1px solid ' + C.line }}>
            {Object.entries(zone.land_use).filter(([, v]) => v > 0).map(([k, pct], i, arr) => {
              const m = LU_META[k] || { label: k };
              // vary shades of gray for each segment so they're distinguishable
              const shades = [C.ink, C.text, C.textDim, C.mute, C.line];
              return <div key={k} title={`${m.label}: ${pct}%`}
                style={{ width: `${pct}%`, background: shades[i % shades.length] }} />;
            })}
          </div>
        </div>

        {derivedTotal !== zone.pop.total && (
          <div style={{
            background: C.surface, border: '1px solid ' + C.ink, borderRadius: R.sm,
            padding: '12px 18px', fontSize: F.base, color: C.ink, fontWeight: 600,
          }}>
            ⚠ נתונים שונו מהמקור — החישוב ישקף את הערכים המעודכנים
          </div>
        )}

      </div>
    </div>
  );
}
