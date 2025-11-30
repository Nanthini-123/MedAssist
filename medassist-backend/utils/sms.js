// medassist-backend/utils/sms.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const MSG91_BASE = "https://api.msg91.com/api/v5";

/**
 * sendSms({ phone, messageVariables })
 * - phone: recipient number in international format (e.g., 919876543210)
 * - messageVariables: object containing placeholders used in your MSG91 flow (e.g., { otp: "123456" })
 */
export async function sendSms({ phone, messageVariables }) {
  if (!phone) throw new Error("Phone number is required");

  const url = `${MSG91_BASE}/sms/flow/`;

  const body = {
    flow_id: process.env.MSG91_SMS_FLOW_ID,
    recipients: [phone],
    ...(messageVariables && { flow_variables: messageVariables })
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "authkey": process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    try {
      const data = JSON.parse(text);
      console.log("MSG91 SMS JSON response:", data);
      return data;
    } catch (parseErr) {
      console.error("RAW MSG91 RESPONSE:", text);
      console.error("JSON parse failed:", parseErr);
      throw new Error(text);
    }

  } catch (err) {
    console.error("sendSms error:", err);
    throw err;
  }
}

/**
 * sendWhatsAppMessage({ phone, message, templateName, templateParams })
 * - phone: recipient number in international format
 * - message: plain text message
 * - templateName: MSG91 WhatsApp template name (optional)
 * - templateParams: array of template variables (optional)
 */
export async function sendWhatsAppMessage({ phone, message, templateName, templateParams }) {
  if (!phone) throw new Error("Phone number is required");

  const url = `${MSG91_BASE}/whatsapp/send`;

  const payload = templateName
    ? {
        to: phone,
        type: "template",
        template_name: templateName,
        template_params: templateParams || []
      }
    : {
        to: phone,
        type: "text",
        text: { body: message }
      };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "authkey": process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    try {
      const data = JSON.parse(text);
      console.log("MSG91 WhatsApp JSON response:", data);
      return data;
    } catch (parseErr) {
      console.error("RAW MSG91 RESPONSE:", text);
      console.error("JSON parse failed:", parseErr);
      throw new Error(text);
    }

  } catch (err) {
    console.error("sendWhatsAppMessage error:", err);
    throw err;
  }
}