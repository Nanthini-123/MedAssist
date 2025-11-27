// backend/helpers/sms.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const MSG91_BASE = "https://api.msg91.com/api/v5"; // v5 endpoints (SMS/WhatsApp)

/**
 * sendSms({ phone, message })
 * phone: in international format without '+' e.g. 919876543210
 */
export async function sendSms({ phone, message }) {
  const url = `${MSG91_BASE}/sms`;
  const body = {
    flow_id: process.env.MSG91_SMS_FLOW_ID || undefined,
    sender: process.env.MSG91_SENDER_ID,
    recipients: [phone],
    // if using template-less, use "message" in transactional API — use flow/template accordingly
    // Here we'll call the SMS endpoint for simple text (depends on your MSG91 plan)
    sms: [{ message }]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "authkey": process.env.MSG91_AUTH_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const j = await res.json();
    // MSG91 may return different shapes; log for debugging
    console.log("MSG91 SMS response:", j);
    return j;
  } catch (err) {
    console.error("sendSms error:", err);
    throw err;
  }
}

/**
 * sendWhatsAppMessage({ phone, message, templateName, templateParams })
 * phone: 919876543210
 * If using template-based WhatsApp with MSG91, you may use templateName + templateParams.
 * This helper uses the v5/whatsapp/send endpoint if available.
 */
export async function sendWhatsAppMessage({ phone, message, templateName, templateParams }) {
  // If templateName provided -> use template flow; else send simple text (if your provider supports it)
  const url = `${MSG91_BASE}/whatsapp/send`;
  const payload = templateName ? {
    to: phone,
    type: "template",
    template_name: templateName,
    template_params: templateParams || []
  } : {
    to: phone,
    type: "text",
    text: { body: message }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "authkey": process.env.MSG91_AUTH_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    console.log("MSG91 WhatsApp response:", j);
    return j;
  } catch (err) {
    console.error("sendWhatsAppMessage error:", err);
    throw err;
  }
}