import React, { useState } from "react";
import { addNote } from "../api";

export default function Notes({ visitorEmail, notes: initial=[] }) {
  const [notes, setNotes] = useState(initial || []);
  const [text, setText] = useState("");

  async function saveNote() {
    if (!text) return;
    const res = await addNote(visitorEmail, text, "operator_1");
    if (res && res.success) {
      setNotes(prev => [res.note, ...prev]);
      setText("");
    } else {
      alert("Note failed");
    }
  }

  return (
    <div>
      <div className="card">
        <h4>Operator Notes</h4>
        <textarea rows={3} value={text} onChange={e=>setText(e.target.value)} style={{width:"100%",marginBottom:8}} placeholder="Add internal note" />
        <div><button onClick={saveNote}>Add Note</button></div>

        <div className="notes-list" style={{marginTop:10}}>
          {notes.map(n => (
            <div key={n.id} style={{padding:8,borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:13}}>{n.note}</div>
              <div style={{fontSize:11,opacity:0.7}}>By {n.operator_id} • {new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}