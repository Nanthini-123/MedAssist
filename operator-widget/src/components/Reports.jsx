import React from "react";

export default function Reports({ visitor }) {
  const reports = visitor.reports || [];

  function openReport(url) {
    window.open(url, "_blank");
  }

  return (
    <div>
      <div className="card">
        <h4>Uploaded Reports</h4>
        {reports.length === 0 && <div>No uploaded files.</div>}
        <ul>
          {reports.map((r, idx) => (
            <li key={idx} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>{r.filename || r.url}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>openReport(r.url)}>View</button>
                  <a href={r.url} download>Download</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}