// frontend/chatbot.js
const BASE_URL = window.BASE_API_URL || "http://localhost:10000"; // change after deploy

async function sendOtp(phone) {
  const res = await fetch(`${BASE_URL}/api/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  return res.json();
}

async function verifyOtp(phone, code, name, email) {
  const res = await fetch(`${BASE_URL}/api/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code, name, email })
  });
  return res.json();
}

async function analyzeSymptoms(text) {
  const res = await fetch(`${BASE_URL}/api/analyze-symptoms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  return res.json();
}

async function getAvailability(doctorId, date) {
  const res = await fetch(`${BASE_URL}/api/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
  return res.json();
}

async function bookAppointment(payload) {
  const res = await fetch(`${BASE_URL}/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// Helper: push a simple system message into a chat UI placeholder
function chatPushSystemMessage(text) {
  // If you have a chat area, adapt this. Minimal implementation: console + alert fallback
  console.log("SYSTEM MESSAGE:", text);
  // If chat area exists, append:
  const chatArea = document.getElementById("chat-area");
  if (chatArea) {
    const el = document.createElement("pre");
    el.style.background = "#fff";
    el.style.padding = "10px";
    el.style.borderRadius = "8px";
    el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
    el.style.margin = "10px 0";
    el.textContent = text;
    chatArea.appendChild(el);
    chatArea.scrollTop = chatArea.scrollHeight;
  } else {
    // small user-friendly toast
    // do not spam: only alert for critical flows
    //alert(text);
  }
}

// Show booking confirmation + optionally compute distance
async function showBookingConfirmation(responseJson) {
  const clinic = responseJson.clinic || {};
  let distanceText = "";

  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      try {
        const r = await fetch(`${BASE_URL}/api/clinic?lat=${userLat}&lng=${userLng}`);
        const cj = await r.json();
        if (cj.distance_km !== undefined) distanceText = `You are ~${cj.distance_km} km away from the clinic.`;
      } catch (e) {
        // ignore
      }
    } catch (err) {
      // user denied or timeout
    }
  }

  const message = [
    `✅ Appointment confirmed!`,
    `Booking ID: ${responseJson.bookingId}`,
    `Clinic: ${clinic.name || "MedAssist Clinic"}`,
    `Address: ${clinic.address || ""}`,
    `Reception: ${clinic.reception_phone || ""}`,
    distanceText ? distanceText : "",
    `Open in Maps: ${clinic.maps_link || process.env.CLINIC_MAP_LINK || ""}`
  ].filter(Boolean).join("\n");

  chatPushSystemMessage(message);
}

// Example: small demo function to simulate a booking flow (call from console)
async function demoBook() {
  const payload = {
    visitorName: "Demo User",
    visitorEmail: "demo@example.com",
    visitorPhone: "9999999999",
    visitorAge: 25,
    doctorId: "doc1",
    doctorName: "Dr Demo",
    slotId: "slot-demo-1",
    serviceType: "General Consult",
    date: new Date().toISOString().slice(0,10),
    time: "10:00"
  };
  chatPushSystemMessage("Creating booking...");
  const resp = await bookAppointment(payload);
  if (resp && resp.success) {
    showBookingConfirmation(resp);
  } else {
    chatPushSystemMessage("Booking failed: " + (resp?.error || JSON.stringify(resp)));
  }
}

// expose for manual testing
window.sendOtp = sendOtp;
window.verifyOtp = verifyOtp;
window.analyzeSymptoms = analyzeSymptoms;
window.getAvailability = getAvailability;
window.bookAppointment = bookAppointment;
window.showBookingConfirmation = showBookingConfirmation;
window.demoBook = demoBook;