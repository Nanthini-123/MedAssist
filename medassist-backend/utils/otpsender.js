// utils/otpSender.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function sendOtpViaMsg91(phone, otp) {
  if (process.env.DEMO_MODE === "true") {
    // demo behaviour: return demo otp
    return { success: true, demoOtp: otp, message: "Demo OTP (MSG91 not configured)" };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    return { success: false, message: "MSG91 key not configured" };
  }

  // Example MSG91 HTTP API (ensure correct URL for your account)
  const url = `https://api.msg91.com/api/v5/otp`;
  const body = {
    template_id: process.env.MSG91_TEMPLATE_ID,
    mobile: phone.replace(/\D/g, ""),
    otp: otp,
    authkey: authKey
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "authkey": authKey },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    return { success: true, data };
  } catch (err) {
    console.error("MSG91 send error", err);
    return { success: false, message: err.message };
  }
}