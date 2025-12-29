import crypto from "crypto";
import { ENCRYPT_TEXT_SECRET_KEY } from "./constant.js";

export function encryptText(text: string): string {
  const iv = crypto.randomBytes(16); // Generate a random 16-byte initialization vector

  // Ensure the key is a 32-byte buffer
  const key = Buffer.from(ENCRYPT_TEXT_SECRET_KEY, "hex");

  // Create AES cipher
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf-8", "hex"); // Encrypt the text
  encrypted += cipher.final("hex"); // Finalize the encryption
  const ivHex = iv.toString("hex"); // Convert IV to hex format for storage
  return `${ivHex}:${encrypted}`; // Return IV + encrypted data
}

// Function to decrypt data
export function decryptText(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(":"); // Split IV and encrypted data
  const iv = Buffer.from(ivHex, "hex"); // Convert the IV back from hex to a buffer

  // Ensure the key is a 32-byte buffer
  const key = Buffer.from(ENCRYPT_TEXT_SECRET_KEY, "hex");

  // Create AES decipher
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf-8"); // Decrypt the text
  decrypted += decipher.final("utf-8"); // Finalize the decryption
  return decrypted;
}
