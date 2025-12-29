import twilio from "twilio";

import { accountSid, authToken, twilioPhoneNumber } from "./constant.js";

export const sendSMS = async (to: string, message: string): Promise<void> => {
  try {
    const client = twilio(accountSid, authToken);
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });

    console.log("SMS sent successfully:", messageResponse.sid);
  } catch (error: any) {
    if (error instanceof Error) {
      console.error("Error sending SMS:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    throw error;
  }
};
