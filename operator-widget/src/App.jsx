import React, { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "./themeContext.jsx";
import { getVisitorContext, addNote, cancelBooking, rescheduleBooking, resendConfirmation } from "./serviceApi.js";
import ProfileCard from "./components/ProfileCard.jsx";
import SymptomsCard from "./components/Symptoms.jsx";
import BookingCard from "./components/BookingCard.jsx";
import ReportsCard from "./components/ReportsCard.jsx";
import NotesCard from "./components/NotesCard.jsx";

function Sidebar({ active, setActive, theme, setTheme }) {
  const items = ["profile","symptoms","booking","reports","notes"];
  return (
    <div className="sidebar">
      <div className="logo">MedAssist OP</div>
      <div className="nav">
        {items.map(it => (
          <button key={it} className={active===it?"active":""} onClick={()=>setActive(it)}>{it.toUpperCase()}</button>
        ))}
      </div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?"Light":"Dark"}</button>
      </div>
    </div>
  );
}

function AppInner(){
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState("profile");
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    // widget can receive email from SalesIQ via URL param or postMessage
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) loadVisitor(email);

    window.addEventListener("message", (e)=>{
      const d = e.data||{};
      if (d.type === "visitor_info" && d.email) loadVisitor(d.email);
    });
    // salesiq widget listener
    if (window.$zoho && window.$zoho.salesiq && window.$zoho.salesiq.widget) {
      try { window.$zoho.salesiq.widget.on("visitorinfo", v => { if (v?.email) loadVisitor(v.email); }); } catch {}
    }

    // apply theme CSS
    if (theme === "dark") {
      document.documentElement.style.setProperty("--bg", "var(--dark-bg)");
      document.documentElement.style.setProperty("--card", "var(--dark-card)");
      document.documentElement.style.setProperty("--text", "var(--dark-text)");
      document.documentElement.style.setProperty("--primary", "var(--accent)");
    } else {
      document.documentElement.style.setProperty("--bg", "var(--light-bg)");
      document.documentElement.style.setProperty("--card", "var(--light-card)");
      document.documentElement.style.setProperty("--text", "var(--light-text)");
      document.documentElement.style.setProperty("--primary", "var(--primary)");
    }
  }, [theme]);

  async function loadVisitor(email){
    setLoading(true);
    try {
      const data = await getVisitorContext(email);
      setVisitor(data);
    } catch(err){ console.error(err); }
    setLoading(false);
  }

  // action wrappers
  async function onCancel(bookingId){
    if (!confirm("Cancel booking?")) return;
    await cancelBooking(bookingId);
    alert("Cancelled. Refresh to see changes.");
  }
  async function onReschedule(bookingId, newDate, newTime){
    await rescheduleBooking(bookingId, newDate, newTime);
    alert("Reschedule requested. Refresh to see changes.");
  }
  async function onResend(bookingId){
    await resendConfirmation(bookingId);
    alert("Resent confirmation.");
  }

  return (
    <div className="app">
      <Sidebar active={active} setActive={setActive} theme={theme} setTheme={setTheme} />
      <div className="content">
        <div className="header">
          <div>Operator Console</div>
          <div style={{display:"flex",gap:8}}>
            <div style={{fontSize:12,opacity:0.8}}>{visitor?.visitorName || "No visitor loaded"}</div>
            <button className="small-btn" onClick={()=>window.parent.postMessage({type:"open_chat", email: visitor?.visitorEmail}, "*")}>Open Chat</button>
          </div>
        </div>

        {loading && <div className="card">Loading...</div>}
        {!loading && !visitor && <div className="card">No visitor. Click a conversation or load by email param.</div>}

        {!loading && visitor && (
          <>
            {active==="profile" && <ProfileCard visitor={visitor} />}
            {active==="symptoms" && <SymptomsCard visitor={visitor} onAIAnalyze={() => {/* handled inside */}} />}
            {active==="booking" && <BookingCard visitor={visitor} onCancel={onCancel} onReschedule={onReschedule} onResend={onResend} />}
            {active==="reports" && <ReportsCard visitor={visitor} />}
            {active==="notes" && <NotesCard visitor={visitor} onNoteAdded={(note)=>{ /* reload notes locally if needed */ }} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function App(){
  return (<ThemeProvider><AppInner/></ThemeProvider>);
}