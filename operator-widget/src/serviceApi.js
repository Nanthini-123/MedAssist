const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000/api";

export async function getVisitorContext(email){
  const r = await fetch(`${BASE.replace(/\/$/,"")}/visitor-context?email=${encodeURIComponent(email)}`);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function addNote(visitorEmail, noteText, operatorId="operator_1"){
  const r = await fetch(`${BASE.replace(/\/$/,"")}/visitor-context/notes`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ visitorEmail, noteText, operatorId })
  });
  return r.json();
}
export async function cancelBooking(bookingId){
  const r = await fetch(`${BASE.replace(/\/$/,"")}/cancel`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ bookingId }) });
  return r.json();
}
export async function rescheduleBooking(bookingId, newDate, newTime){
  const r = await fetch(`${BASE.replace(/\/$/,"")}/reschedule`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ bookingId, newDate, newTime }) });
  return r.json();
}
export async function resendConfirmation(bookingId){
  const r = await fetch(`${BASE.replace(/\/$/,"")}/resend`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ bookingId }) });
  return r.json();
}
export async function openrouterAnalyze(text){
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || "anthropic/claude-opus-4.5";
  if(!key) return null;
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages:[{ role:"user", content: `Analyze these symptoms and return JSON: specialty, severity (LOW/MED/HIGH), notes. Symptoms: ${text}` }],
      max_tokens: 800
    })
  });
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  try { return JSON.parse(content); } catch { return { notes: content }; }
}