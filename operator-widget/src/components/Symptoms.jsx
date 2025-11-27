import React, { useState } from "react";
import { openrouterAnalyze } from "../api";

export default function Symptoms({ visitor }) {
  const [analysis, setAnalysis] = useState({ specialty: visitor?.suggestedSpecialty || "", severity: visitor?.severity || "", notes: "" });
  const [loading, setLoading] = useState(false);

  async function analyzeNow() {
    setLoading(true);
    try {
      const text = visitor?.lastMessages || visitor?.symptoms || "";
      const ai = await openrouterAnalyze(text);
      if (ai && (ai.specialty || ai.severity)) {
        setAnalysis({ specialty: ai.specialty || analysis.specialty, severity: ai.severity || analysis.severity, notes: ai.notes || ai.notes || "" });
      } else {
        setAnalysis(prev => ({...prev, notes: "No AI result; use rule-based or manual."}));
      }
    } catch (err) {
      console.error(err);
      setAnalysis(prev => ({...prev, notes: "Analyze failed"}));
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="card">
        <h4>Symptoms</h4>
        <div style={{whiteSpace:"pre-wrap"}}>{visitor?.symptoms || visitor?.lastMessages || "No symptoms collected."}</div>
        <div style={{marginTop:8}}>
          <button onClick={analyzeNow} style={{padding:"8px 10px",borderRadius:8}}>Analyze with AI</button>
        </div>
      </div>

      <div className="card">
        <h4>AI Analysis</h4>
        <div>Specialty: <strong>{analysis.specialty || "—"}</strong></div>
        <div>Severity: <strong>{analysis.severity || "—"}</strong></div>
        <div style={{marginTop:8,whiteSpace:"pre-wrap"}}>Notes: {analysis.notes || "—"}</div>
      </div>
    </div>
  );
}