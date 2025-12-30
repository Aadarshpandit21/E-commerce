import { AppleIdTokenType, verifyIdToken } from "apple-signin-auth";
import { TokenPayload, OAuth2Client } from "google-auth-library";
import { Accounts } from "../entities/accounts.entities.js";
import { MySQLDataSource } from "../data-source.js";
import { SignupInterface } from "../controllers/account.controller.js";
import { RefreshTokenPayload, AccessTokenPayload } from "../utils/interface.js";
import { Role } from "../utils/enum.js";
import { addMilliseconds } from "date-fns";
import {
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRE_IN_MS,
} from "../services/constant.js";
import { SignJWT } from "jose";

const accountRepository = MySQLDataSource.getRepository(Accounts);

export const verifyGoogleIdToken = (idToken: string, audience: string[]) =>
  new Promise<[null | Error, TokenPayload | undefined]>((resolve, _reject) => {
    const oauth2Client = new OAuth2Client();
    oauth2Client.verifyIdToken(
      {
        idToken,
        audience,
      },
      (err, login) => {
        if (err || login === undefined) {
          return resolve([err, undefined]);
        }
        resolve([null, login.getPayload()]);
      }
    );
  });

// export const verifyGoogleIdToken = async (
//   idToken: string,
//   audience: string[]
// ): Promise<[null | Error, TokenPayload | undefined]> => {
//   try {
//     const oauth2Client = new OAuth2Client()
//     const ticket = await oauth2Client.verifyIdToken({
//       idToken,
//       audience,
//     })
//     return [null, ticket.getPayload()]
//   } catch (err) {
//     return [err as Error, undefined]
//   }
// }

export const verifyAppleIdToken = async (
  idToken: string,
  audience: string
): Promise<[Error | null, null | AppleIdTokenType]> => {
  try {
    const appleIdToken = await verifyIdToken(idToken, {
      audience,
      ignoreExpiration: true,
    });
    return [null, appleIdToken];
  } catch (err) {
    return [err as Error, null];
  }
};

export const afterUserVerified = async (user: SignupInterface) => {
  const refreshTokenPayload: RefreshTokenPayload = {
    userId: user.id,
  };
  const accessTokenPayload: AccessTokenPayload = {
    ...refreshTokenPayload,
    role: user.role ?? Role.USER,
  };

  const expireAt = addMilliseconds(new Date(), ACCESS_TOKEN_EXPIRE_IN_MS);
  const accessToken = await new SignJWT(accessTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(expireAt.getTime() / 1000))
    .sign(JWT_SECRET);
  const lastLoggedInPayload = { lastLoggedIn: new Date() };
  accountRepository.update({ id: user.id }, lastLoggedInPayload);
  return accessToken;
};
