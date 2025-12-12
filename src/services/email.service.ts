import path from "node:path";
import process from "node:process";

import ejs from "ejs";
import { createTransport } from "nodemailer";

import {
  NAME,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
} from "../services/constant.js";

const transporter = createTransport({
  host: SMTP_HOST,
  secure: false,
  port: SMTP_PORT,
  //    replyTo: SMTP_REPLY_TO,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },

  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
});

export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string
): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      to,
      html,
      subject: `${subject} - ${NAME}`,
      from: SMTP_FROM,
    });

    console.log("Send Email:-\t", info);
  } catch (error) {
    console.error("Email Lib Send:-", error);
  }
};

export const getHtml = async (
  template: string,
  data?: ejs.Data,
  options?: ejs.Options
): Promise<string> =>
  await ejs.renderFile(
    path.join(process.cwd(), "assets", template + ".ejs"),
    data,
    options
  );
