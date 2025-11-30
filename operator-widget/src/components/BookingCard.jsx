import React, { useState } from "react";
import { cancelBooking, rescheduleBooking } from "../api";
import { format } from "date-fns";

export default function Booking({ visitor }) {
  const bookings = visitor.upcomingBookings || [];
  const [rescheduleData, setRescheduleData] = useState({ bookingId: null, date:"", time:"" });

  async function doCancel(id) {
    if (!confirm("Cancel this booking?")) return;
    await cancelBooking(id);
    alert("Cancellation requested. Please refresh.");
  }

  async function doReschedule() {
    const { bookingId, date, time } = rescheduleData;
    if (!bookingId || !date || !time) return alert("Select booking & new date/time");
    await rescheduleBooking(bookingId, date, time);
    alert("Reschedule requested. Please refresh.");
  }

  return (
    <div>
      <div className="card">
        <h4>Upcoming Bookings</h4>
        {bookings.length === 0 && <div>No upcoming bookings.</div>}
        {bookings.map(b => (
          <div className="booking-item" key={b.id}>
            <div>
              <div style={{fontWeight:700}}>{b.service_type} with {b.doctor_name}</div>
              <div style={{fontSize:13,opacity:0.8}}>{new Date(b.timeslot).toLocaleString()}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{ setRescheduleData(prev=>({...prev, bookingId:b.id})); alert("Select new date/time below then click Reschedule"); }}>Reschedule</button>
              <button onClick={()=>doCancel(b.id)}>Cancel</button>
              <button onClick={()=>alert("Resend confirmation function not wired in demo")}>Resend</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h4>Reschedule</h4>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="date" value={rescheduleData.date} onChange={(e)=>setRescheduleData({...rescheduleData,date:e.target.value})} />
          <input type="time" value={rescheduleData.time} onChange={(e)=>setRescheduleData({...rescheduleData,time:e.target.value})} />
          <button onClick={doReschedule}>Reschedule</button>
        </div>
      </div>
    </div>
  );
}