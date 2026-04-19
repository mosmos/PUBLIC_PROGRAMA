import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import ZoneSelector from "../step_1.jsx";
import Step2 from "./Step2";
import Step3 from "./Step3";
import SimCatalog from "./SimCatalog";
import { useSimulations } from "./useSimulations";

function App() {
  const { sims, saveNew, saveVersion, saveCopy, deleteSim } = useSimulations();

  // 'catalog' | 'step1' | 'step2' | 'step3'
  const [view, setView] = useState(() =>
    Object.keys(JSON.parse(localStorage.getItem('programa_simulations') || '{}')).length > 0
      ? 'catalog' : 'step1'
  );
  const [zone, setZone] = useState(null);
  const [currentSimId, setCurrentSimId] = useState(null);

  // Step 1 → select zone
  const handleSelect = (z) => { setZone(z); setView('step2'); };

  // Step 2 → proceed with (possibly edited) zone to Step 3
  const handleContinue = (editedZone) => { setZone(editedZone); setView('step3'); };

  // Catalog actions
  const handleOpen = (sim) => {
    setZone(sim.zone);
    setCurrentSimId(sim.id);
    setView('step3');
  };
  const handleEdit = (sim) => {
    setZone(sim.zone);
    setCurrentSimId(sim.id);
    setView('step2');
  };
  const handleCopy = (sim) => { saveCopy(sim); };
  const handleDelete = (id) => { deleteSim(id); };

  // Step 3 save actions — results come from Step3's useMemo
  const handleSave = (name, results) => {
    if (currentSimId) {
      saveVersion(currentSimId, name, zone, results);
    } else {
      const id = saveNew(name, zone, results);
      setCurrentSimId(id);
    }
  };
  const handleSaveCopy = (name, results) => {
    saveCopy({ name, zone, results, version: 1, area_label: zone.name, zone_type: zone.type_heb,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  };

  const goRestart = () => { setZone(null); setCurrentSimId(null); setView('step1'); };
  const goCatalog = () => setView('catalog');

  return (
    <>
      {view === 'catalog' && (
        <SimCatalog
          sims={sims}
          onNew={() => { setCurrentSimId(null); setZone(null); setView('step1'); }}
          onOpen={handleOpen}
          onEdit={handleEdit}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />
      )}

      {view === 'step1' && (
        <div>
          {/* Catalog link */}
          <div dir="rtl" style={{ padding: '10px 20px', textAlign: 'left' }}>
            <button onClick={goCatalog} style={{
              padding: '6px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}>📋 קטלוג הסימולציות</button>
          </div>
          <ZoneSelector onSelect={handleSelect} />
        </div>
      )}

      {view === 'step2' && zone && (
        <Step2
          zone={zone}
          onBack={() => setView(currentSimId ? 'catalog' : 'step1')}
          onContinue={handleContinue}
        />
      )}

      {view === 'step3' && zone && (
        <Step3
          zone={zone}
          currentSimId={currentSimId}
          onSave={(name) => handleSave(name, null)}
          onSaveCopy={(name) => handleSaveCopy(name, null)}
          onBack={() => setView('step2')}
          onRestart={goRestart}
          onCatalog={goCatalog}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
