// utils/sms.js
import axios from "axios";

export async function sendSms({ phone, otp }) {
  try {
    // 2factor API key from env
    const apiKey = process.env.TWOFACTOR_API_KEY;

    // 2factor endpoint for SMS OTP
    // AUTOGEN lets 2factor generate OTP automatically
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN`;

    // Send GET request
    const response = await axios.get(url);

    console.log("OTP sent via 2factor.in:", response.data);
    return response.data;
  } catch (err) {
    console.error("SEND SMS ERROR:", err.message);
    throw err;
  }
}