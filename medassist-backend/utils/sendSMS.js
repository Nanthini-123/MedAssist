// medassist-backend/utils/sendSMS.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Send SMS using MSG91
 * @param {string} to - recipient phone number in international format (e.g., 919876543210)
 * @param {string} message - SMS content
 */
const sendSMS = async (to, message) => {
  try {
    const apiKey = process.env.MSG91_AUTH_KEY;   // MSG91 auth key
    const sender = process.env.MSG91_SENDER_ID; // e.g., "MEDAST"
    
    const url = `https://api.msg91.com/api/v5/flow/`;

    const payload = {
      flow_id: process.env.MSG91_FLOW_ID, // your flow id from MSG91
      sender: sender,
      recipients: [
        { mobile: to }
      ],
      // Optional: variables for your flow placeholders
      // variables: { "NAME": "User", "MESSAGE": message }
    };

    const headers = {
      "accept": "application/json",
      "content-type": "application/json",
      "authkey": apiKey,
    };

    const response = await axios.post(url, payload, { headers });
    console.log("SMS sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending SMS via MSG91:", error.response?.data || error.message);
    throw error;
  }
};

// Default export so you can do: import sendSMS from '../utils/sendSMS.js'
export default sendSMS;

// Optional named export for backward compatibility
export { sendSMS };