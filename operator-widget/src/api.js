// API helper for widget. Uses VITE_API which should point to your backend base URL.
const BASE = import.meta.env.VITE_API || "http://localhost:10000";

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

export async function getVisitorContext(email) {
  return request(`/api/visitor-context?email=${encodeURIComponent(email)}`);
}

export async function addNote(visitorEmail, noteText, operatorId="operator_1") {
  return request("/api/visitor-context/notes", {
    method: "POST",
    body: JSON.stringify({ visitorEmail, noteText, operatorId })
  });
}

export async function resendConfirmation(bookingId) {
  return request("/api/book/resend", { method: "POST", body: JSON.stringify({ bookingId }) }).catch(err=>({success:false, error:err.message}));
}

export async function cancelBooking(bookingId) {
  return request("/api/book/cancel", { method: "POST", body: JSON.stringify({ bookingId }) });
}

export async function rescheduleBooking(bookingId, newDate, newTime) {
  return request("/api/book/reschedule", { method: "POST", body: JSON.stringify({ bookingId, newDate, newTime }) });
}

export async function fetchDoctorAvailability(doctorId, date) {
  return request(`/api/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
}

// Optional: call OpenRouter for extra analysis if available
export async function openrouterAnalyze(text) {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0",
        messages: [{ role: "user", content: `Given these symptoms: ${text}\nReturn a short JSON with fields: specialty, severity (LOW/MED/HIGH), notes.` }]
      })
    });
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    try { return JSON.parse(content); } catch { return { notes: content }; }
  } catch (err) {
    console.warn("OpenRouter analyze failed", err.message);
    return null;
  }
}