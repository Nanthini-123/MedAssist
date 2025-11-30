// src/serviceApi.js
const BASE = import.meta.env.VITE_BACKEND_URL || "https://medassist-backend-zhg6.onrender.com";

/**
 * Fetch visitor info by email
 * Must match backend route: GET /api/visitors/email/:email
 */
export async function getVisitorContext(phone){
  const r = await fetch(`${BASE.replace(/\/$/,"")}/api/visitors/phone/${encodeURIComponent(phone)}`);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Add a note to a visitor by their email
 * Backend route: POST /api/visitors/:id/notes
 * Needs visitor ID from visitor object
 */
export async function addNote(visitorId, noteText, operatorId="operator_1") {
  const url = `${BASE.replace(/\/$/,"")}/api/visitors/${visitorId}/notes`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteText, operatorId })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Cancel a booking by booking ID
 * Backend route: POST /api/bookings/:id/cancel
 */
export async function cancelBooking(bookingId) {
  const url = `${BASE.replace(/\/$/,"")}/api/bookings/${bookingId}/cancel`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Reschedule a booking
 * Backend route: POST /api/bookings/:id/reschedule
 */
export async function rescheduleBooking(bookingId, newDate, newTime) {
  const url = `${BASE.replace(/\/$/,"")}/api/bookings/${bookingId}/reschedule`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newDate, newTime })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Resend booking confirmation
 * Backend route: POST /api/bookings/:id/resend
 */
export async function resendConfirmation(bookingId) {
  const url = `${BASE.replace(/\/$/,"")}/api/bookings/${bookingId}/resend`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Analyze symptoms via OpenRouter AI
 */
export async function openrouterAnalyze(text) {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || "anthropic/claude-opus-4.5";
  if (!key) return null;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: `Analyze these symptoms and return JSON: specialty, severity (LOW/MED/HIGH), notes. Symptoms: ${text}` }],
      max_tokens: 800
    })
  });

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  try { 
    return JSON.parse(content); 
  } catch { 
    return { notes: content }; 
  }
}