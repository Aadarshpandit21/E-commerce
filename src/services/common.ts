import PasswordValidator from "password-validator";
import generatePassword from "omgopass";
import dumbPasswords from "dumb-passwords";
import { randomBytes } from "crypto";

export function isValidPassword(password: string, email: string): boolean {
  const [username, domain] = email.split("@");
  const schema = new PasswordValidator();
  schema
    .is()
    .min(8)
    .is()
    .max(100)
    .has()
    .uppercase()
    .has()
    .lowercase()
    .has()
    .digits(2)
    .has()
    .symbols(1)
    .has()
    .not()
    .spaces()
    .is()
    .not()
    .oneOf([username, domain.split(".")[0]]); // Blacklist these values
  if (!(schema.validate(password) as boolean)) return false;
  // check password from dumb-passwords
  return !dumbPasswords.check(password);
}

export function getPassword(): string {
  return generatePassword({
    separators: "&%?$*@#",
  });
}

export async function wait(second: number): Promise<void> {
  await new Promise((resolve, _reject) => {
    setTimeout(resolve, second * 1000);
  });
}

export function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charsLength = chars.length;

  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes(1).readUInt8(0) % charsLength;
    randomString += chars[randomIndex];
  }

  return randomString;
}
