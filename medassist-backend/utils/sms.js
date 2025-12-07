import axios from "axios";

/**
 * Send SMS via Fast2SMS Quick SMS
 * @param {string} phone - Recipient number with country code (e.g., 918637499280)
 * @param {string} message - Message text
 */
export const sendSms = async (phone, message) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: message,
        numbers: phone,
        flash: 0,
        schedule_time: ""
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data.return) {
      throw new Error(response.data.message || "Fast2SMS rejected request");
    }

    return response.data;
  } catch (err) {
    console.error("Fast2SMS error:", err.response?.data || err.message);
    throw new Error("Failed to send SMS");
  }
};