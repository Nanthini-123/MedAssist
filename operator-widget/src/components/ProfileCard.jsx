import React from "react";

export default function Profile({ visitor }) {
  return (
    <div>
      <div className="card" style={{display:"flex",gap:12,alignItems:"center"}}>
        <div className="avatar" style={{background:"var(--primary)",color:"#fff",fontSize:18}}>
          {visitor.visitorName ? visitor.visitorName.split(" ").map(s=>s[0]).slice(0,2).join("") : "NA"}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:16}}>{visitor.visitorName}</div>
          <div style={{fontSize:13,opacity:0.9}}>{visitor.visitorEmail || "—"}</div>
          <div style={{fontSize:13,opacity:0.9}}>{visitor.visitorPhone || "—"}</div>
        </div>
        <div style={{flex:1}} />
        <div style={{textAlign:"right", fontSize:12}}>
          <div>Severity: <strong>{visitor.severity||"N/A"}</strong></div>
          <div>Suggested: <strong>{visitor.suggestedSpecialty||"N/A"}</strong></div>
        </div>
      </div>

      <div className="card">
        <h4>Quick Info</h4>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,opacity:0.8}}>Bookings</div>
            <div style={{fontWeight:700}}>{visitor.upcomingBookings?.length || 0}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,opacity:0.8}}>Notes</div>
            <div style={{fontWeight:700}}>{visitor.notes?.length || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}