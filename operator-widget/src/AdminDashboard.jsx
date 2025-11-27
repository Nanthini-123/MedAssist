import React, { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import 'chart.js/auto';

export default function AdminDashboard(){
  const [stats,setStats]=useState(null);
  useEffect(()=>{ fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/stats`).then(r=>r.json()).then(setStats).catch(console.error); },[]);
  if(!stats) return <div>Loading stats...</div>;

  const labels = stats.bookings.map(r=> new Date(r.day).toLocaleDateString());
  const dataBookings = { labels, datasets:[{ label:'Bookings', data: stats.bookings.map(r=>r.cnt), fill:false }] };
  const pieData = { labels: stats.severity.map(s=>s.severity), datasets:[{ data: stats.severity.map(s=>s.cnt) }] };

  return (
    <div style={{padding:16}}>
      <h3>Admin Dashboard</h3>
      <div style={{maxWidth:800}}>
        <Line data={dataBookings}/>
        <div style={{width:300, marginTop:24}}><Pie data={pieData}/></div>
      </div>
    </div>
  );
}