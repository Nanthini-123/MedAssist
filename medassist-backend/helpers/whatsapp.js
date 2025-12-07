import axios from "axios";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER = process.env.MSG91_SENDER; // Your sender ID

export async function sendWhatsApp({ phone, message }) {
  try {
    const url = `https://api.msg91.com/api/v5/whatsapp/send`;
    const payload = {
      template_id: "your_template_id", // pre-approved template
      to: phone,
      content: [{ type: "text", text: message }],
      sender: MSG91_SENDER,
    };

    const res = await axios.post(url, payload, {
      headers: {
        "authkey": MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      }
    });

    return res.data;
  } catch (err) {
    console.error("WhatsApp error:", err.response?.data || err.message);
  }
}