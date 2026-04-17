import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import ZoneSelector from "../step_1.jsx";

function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <ZoneSelector onSelect={setSelected} />
      {selected && (
        <div style={{
          margin: "20px auto", maxWidth: 700, background: "#d1fae5",
          border: "1.5px solid #10b981", borderRadius: 10, padding: "16px 24px",
          fontFamily: "inherit", fontSize: 14, color: "#065f46"
        }}>
          <strong>onSelect called:</strong> {selected.name} (id: {selected.id}, type: {selected.type_heb})
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
