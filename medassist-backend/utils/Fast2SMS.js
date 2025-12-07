import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const sendSMS = async (message, number) => {
  return axios.post(
    "https://www.fast2sms.com/dev/bulkV2",
    {
      route: "v3",
      sender_id: "FSTSMS",
      message,
      numbers: number,
    },
    {
      headers: {
        Authorization: process.env.FAST2SMS_API_KEY,
      },
    }
  );
};