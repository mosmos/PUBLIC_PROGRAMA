import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import ZoneSelector from "../step_1.jsx";
import Step2 from "./Step2";
import Step3 from "./Step3";
import SimCatalog from "./SimCatalog";
import { useSimulations } from "./useSimulations";

function App() {
  const { sims, saveNew, saveVersion, saveCopy, deleteSim } = useSimulations();

  // Start at step1; switch to catalog once files have loaded and there are saved sims
  const [view, setView] = useState('step1');
  const [zone, setZone] = useState(null);
  const [currentSimId, setCurrentSimId] = useState(null);
  const [catalogShown, setCatalogShown] = useState(false);

  useEffect(() => {
    if (!catalogShown && Object.keys(sims).length > 0) {
      setView('catalog');
      setCatalogShown(true);
    }
  }, [sims, catalogShown]);

  const handleSelect   = (z)          => { setZone(z); setView('step2'); };
  const handleContinue = (editedZone) => { setZone(editedZone); setView('step3'); };

  const handleOpen = (sim) => { setZone(sim.zone); setCurrentSimId(sim.id); setView('step3'); };
  const handleEdit = (sim) => { setZone(sim.zone); setCurrentSimId(sim.id); setView('step2'); };

  const handleSave = async (name, results, ctx) => {
    if (currentSimId) {
      await saveVersion(currentSimId, name, zone, results, ctx);
    } else {
      const id = await saveNew(name, zone, results, ctx);
      setCurrentSimId(id);
    }
  };

  const handleSaveCopy = async (name, results, ctx) => {
    await saveCopy({
      name, zone, results, ctx, version: 1,
      area_label: zone.name, zone_type: zone.type_heb,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
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
          onCopy={(sim) => saveCopy(sim)}
          onDelete={(id) => deleteSim(id)}
        />
      )}

      {view === 'step1' && (
        <ZoneSelector onSelect={handleSelect} onCatalog={goCatalog} />
      )}

      {view === 'step2' && zone && (
        <Step2
          zone={zone}
          onBack={() => setView(currentSimId ? 'catalog' : 'step1')}
          onContinue={handleContinue}
          onCatalog={goCatalog}
        />
      )}

      {view === 'step3' && zone && (
        <Step3
          zone={zone}
          currentSimId={currentSimId}
          onSave={(name, results, ctx) => handleSave(name, results, ctx)}
          onSaveCopy={(name, results, ctx) => handleSaveCopy(name, results, ctx)}
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
