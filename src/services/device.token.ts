import { SignJWT } from "jose";

import { addMinutes } from "date-fns";
export interface OtpDeviceTokenPayload {
  action: "email" | "mobile";
  deviceId: string;
  otp: string;
  secretKey: Uint8Array<ArrayBufferLike>;
}

export async function generateDeviceOtpToken({
  action,
  deviceId,
  otp,
  secretKey,
  minutesExpiry,
}: OtpDeviceTokenPayload & { minutesExpiry: number }): Promise<{
  token: string;
  expirationDate: Date;
}> {
  const expirationDate = addMinutes(new Date(), minutesExpiry);
  const expirationTime = Math.floor(expirationDate.getTime() / 1000);

  const token = await new SignJWT({ action, otp, deviceId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .sign(secretKey);

  return { token, expirationDate };
}
