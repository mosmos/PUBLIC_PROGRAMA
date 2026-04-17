import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import ZoneSelector from "../step_1.jsx";
import Step2 from "./Step2";
import Step3 from "./Step3";

function App() {
  const [step, setStep] = useState(1);
  const [zone, setZone] = useState(null);

  const handleSelect = (z) => { setZone(z); setStep(2); };

  return (
    <>
      {step === 1 && (
        <ZoneSelector onSelect={handleSelect} />
      )}
      {step === 2 && zone && (
        <Step2
          zone={zone}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}
      {step === 3 && zone && (
        <Step3
          zone={zone}
          onBack={() => setStep(2)}
          onRestart={() => { setZone(null); setStep(1); }}
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
