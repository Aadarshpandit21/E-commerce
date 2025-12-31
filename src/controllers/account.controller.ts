import { type Request, type NextFunction, type Response } from "express";
import Joi from "joi";
import { SignJWT, jwtVerify } from "jose";
import * as ejv from "express-joi-validation";

import { Role, ActionOfDevice } from "../utils/enum.js";

import { ERR_MSG } from "../services/constant.js";
import HttpStatus from "http-status";
import { Accounts } from "../entities/accounts.entities.js";
import { MySQLDataSource } from "../data-source.js";
import bcrypt from "bcrypt";
import { isValidPassword } from "../services/common.js";
import { AccessTokenPayload, RefreshTokenPayload } from "../utils/interface.js";
import { addMilliseconds } from "date-fns";
import {
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRE_IN_MS,
  JWT_OTP_EXPIRY_TIME,
  JWT_SECRET_EMAIL,
  JWT_SECRET_MOBILE,
} from "../services/constant.js";
import { SessionToken } from "../entities/session.token.entities.js";
import { getHtml } from "../services/email.service.js";
import { sendSMS } from "../services/twillio.service.js";
import { sendEmail } from "../services/email.service.js";
import { generateDeviceOtpToken } from "../services/device.token.js";
import { decryptText, encryptText } from "../services/encrypt.js";
import { OAuthBody } from "../utils/interface.js";
import {
  verifyGoogleIdToken,
  afterUserVerified,
} from "../services/account.service.js";
import { GOOGLE_CLIENT_IDS } from "../services/constant.js";

const sessionTokenRepository = MySQLDataSource.getRepository(SessionToken);

const accountRepository = MySQLDataSource.getRepository(Accounts);

export interface SignupInterface {
  id: number;
  name: string;
  email: string;
  mobile: string;
  password: string;
  role?: Role;
  lastLoggedIn?: Date;
}

interface LoginInterface {
  email?: string;
  mobile?: string;
  password: string;
}

export const signupJoiSchema = Joi.object<SignupInterface>({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  mobile: Joi.number()
    .required()
    .integer()
    .positive()
    .min(6000000000)
    .max(9999999999),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
    .required(),
  role: Joi.string().valid(Role.ADMIN, Role.Employee, Role.USER).optional(),
});

export interface SignupRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: SignupInterface;
}

async function signUpAccount(
  req: ejv.ValidatedRequest<SignupRequestSchema>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, mobile, password } = req.body;

    const emailExists = await accountRepository.exist({
      where: { email },
    });

    if (emailExists) {
      res.status(HttpStatus.CONFLICT).json({
        message: ERR_MSG.emailAlreadyExist,
      });
      return;
    }

    const mobileExists = await accountRepository.exist({
      where: { mobile: mobile?.toString() },
    });

    if (mobileExists) {
      res.status(HttpStatus.CONFLICT).json({
        message: ERR_MSG.mobileAlreadyExist,
      });
      return;
    }

    if (!isValidPassword(password, email)) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: ERR_MSG.invalidPassword,
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const bcryptPassword = bcrypt.hashSync(req.body.password, salt);

    const newUser = accountRepository.create({
      ...req.body,
      password: bcryptPassword,
      isMobileVerified: true,
      isEmailVerified: true,
      isDetailVerfied: true,
    });

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: newUser.id,
    };
    const accessTokenPayload: AccessTokenPayload = {
      ...refreshTokenPayload,
      role: newUser.role,
    };
    await accountRepository.save(newUser);

    const expireAt = addMilliseconds(new Date(), ACCESS_TOKEN_EXPIRE_IN_MS);
    const accessToken = await new SignJWT(accessTokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(expireAt.getTime() / 1000))
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT(refreshTokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(JWT_SECRET);

    if (
      await sessionTokenRepository.exists({
        where: { account: { id: newUser?.id } },
      })
    ) {
      await sessionTokenRepository.update(
        { account: { id: newUser?.id } },
        { sessionToken: accessToken }
      );
    } else {
      await sessionTokenRepository.insert({
        account: { id: newUser?.id },
        sessionToken: accessToken,
      });
    }

    // const emailHtml = await getHtml("register");
    //void sendEmail(email as string, "Succesfully Registered", emailHtml);

    res.status(HttpStatus.OK).json({
      message: "Account Successfully Created and Registered.",
      ...newUser,
      sessionToken: accessToken,
      refreshToken: refreshToken,
      expireAt: expireAt,
    });
  } catch (error) {
    next(error);
  }
}

export const loginJoiSchema = Joi.object<LoginInterface>({
  email: Joi.string().trim().email().optional(),
  mobile: Joi.number()
    .required()
    .integer()
    .positive()
    .min(6000000000)
    .max(9999999999),
  password: Joi.string().required(),
});

export interface LoginRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: LoginInterface;
}

interface SendOtpRequest {
  action: "mobile" | "email";
  mobile?: number;
  email?: string;
}

const resendOtpBodySchema = Joi.object<SendOtpRequest>({
  action: Joi.string()
    .valid(...Object.values(ActionOfDevice))
    .required()
    .trim(),
  mobile: Joi.number()
    .optional()
    .integer()
    .positive()
    .min(6000000000)
    .max(9999999999)
    .default(null),
  email: Joi.string().optional().email().default(null),
});

interface ResendOtpRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: SendOtpRequest;
}

async function resendOTP(
  req: ejv.ValidatedRequest<ResendOtpRequestSchema>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { action, mobile, email } = req.body;

    if (mobile === null && email === null) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: "please provide anyone from mobile number or email",
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    //const otp = "123456";

    if (email) {
      const emailExists = await accountRepository.exist({
        where: { email },
      });

      if (emailExists) {
        res.status(HttpStatus.CONFLICT).json({
          message: ERR_MSG.emailAlreadyExist,
        });
        return;
      }
    }

    if (mobile) {
      const mobileExists = await accountRepository.exist({
        where: { mobile: mobile?.toString(), isMobileVerified: true },
      });

      if (mobileExists) {
        res.status(HttpStatus.CONFLICT).json({
          message: ERR_MSG.mobileAlreadyExist,
        });
        return;
      }
    }

    if (email) {
      const emailExists = await accountRepository.exist({
        where: { email, isEmailVerified: true },
      });

      if (emailExists) {
        res.status(HttpStatus.CONFLICT).json({
          message: ERR_MSG.emailAlreadyExist,
        });
        return;
      }
    }
    let secretKey;
    let deviceNumber = ActionOfDevice.Mobile;

    if (action === ActionOfDevice.Mobile) {
      secretKey = JWT_SECRET_MOBILE;
      //console.log("Otp Sent to mobile:---", { otp, mobile });
      sendSMS(mobile?.toString() as string, otp);
    } else {
      secretKey = JWT_SECRET_EMAIL;
      deviceNumber = ActionOfDevice.Email;
      const emailHtml = await getHtml("otp-email", { otp });
      void sendEmail(email as string, "Your OTP Code", emailHtml);
    }

    const { token, expirationDate } = await generateDeviceOtpToken({
      action,
      deviceId: deviceNumber,
      otp: encryptText(otp),
      secretKey: secretKey,
      minutesExpiry: JWT_OTP_EXPIRY_TIME,
    });

    res.status(HttpStatus.CREATED).json({
      message: "OTP sent successfully",
      token,
      expirationDate,
    });
    return;
  } catch (e) {
    next(e);
  }
}

interface VerifyOtpRequest {
  action: "mobile" | "email";
  mobile: number;
  email?: string;
  otp: number;
  token: string;
}

const verifyOtpBodySchema = Joi.object<VerifyOtpRequest>({
  action: Joi.string()
    .valid(...Object.values(ActionOfDevice))
    .required()
    .trim(),
  mobile: Joi.number()
    .optional()
    .integer()
    .positive()
    .min(6000000000)
    .max(9999999999)
    .allow(null),
  email: Joi.string().optional().email().default(null).allow(null),
  token: Joi.string().required().trim(),
  otp: Joi.number().integer().positive().required(),
});

interface VerifyOtpRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: VerifyOtpRequest;
}

async function verifyOTP(
  req: ejv.ValidatedRequest<VerifyOtpRequestSchema>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { action, mobile, email, otp, token } = req.body;
    let decryptedOtp: string;

    try {
      const secret =
        action === ActionOfDevice.Mobile ? JWT_SECRET_MOBILE : JWT_SECRET_EMAIL;

      const { payload } = await jwtVerify(token, secret);
      decryptedOtp = decryptText(payload.otp as string);
    } catch {
      res.status(HttpStatus.UNAUTHORIZED).json({
        message: "Invalid OTP or expired OTP",
      });
      return;
    }

    if (Number(decryptedOtp) !== otp) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Re-enter the correct OTP",
      });
      return;
    }

    let account: Accounts | null = null;

    if (action === ActionOfDevice.Mobile) {
      if (!mobile) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Mobile number is required",
        });
        return;
      }

      account = await accountRepository.findOne({
        where: { mobile: mobile.toString() },
      });

      if (!account) {
        account = accountRepository.create({
          mobile: mobile.toString(),
          isMobileVerified: true,
          role: Role.USER,
        });
      } else {
        account.isMobileVerified = true;
      }

      await accountRepository.save(account);
    }

    if (action === ActionOfDevice.Email) {
      if (!mobile || !email) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Mobile and Email are required",
        });
        return;
      }

      account = await accountRepository.findOne({
        where: {
          mobile: mobile.toString(),
          isMobileVerified: true,
        },
      });

      if (!account) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: "Please verify mobile number first",
        });
        return;
      }

      const emailUsed = await accountRepository.exists({
        where: { email },
      });

      if (emailUsed && account.email !== email) {
        res.status(HttpStatus.CONFLICT).json({
          message: ERR_MSG.emailAlreadyExist,
        });
        return;
      }

      account.email = email;
      account.isEmailVerified = true;

      await accountRepository.save(account);
    }

    res.status(HttpStatus.OK).json({
      message: "OTP verified successfully",
      id: account?.id,
      mobile: account?.mobile,
      email: account?.email,
      mobileVerified: account?.isMobileVerified,
      emailVerified: account?.isEmailVerified,
    });
  } catch (error) {
    next(error);
  }
}

const schema = Joi.object<OAuthBody>({
  idToken: Joi.string().required(),
});
export const continueWithGoogle = async (req: Request, res: Response) => {
  const { error, value: payload } = schema.validate(req.body);

  if (error || payload === undefined) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Invalid request body" });
  }

  const [err, oAuthUser] = await verifyGoogleIdToken(
    payload.idToken,
    GOOGLE_CLIENT_IDS
  );

  if (err || oAuthUser === undefined) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: err?.message });
  }

  let user = await accountRepository.findOne({
    where: { email: oAuthUser.email },
  });
  if (!user) {
    user = await accountRepository.create({
      email: oAuthUser.email,
      isEmailVerified: true,
      name: oAuthUser.name,
    });

    const welcomeHtml = await getHtml("welcome.template");
    sendEmail(user.email, "Welcome to E-commerce", welcomeHtml).finally();
  }

  if (!user.isActive) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "your account is disabled" });
  }

  // generate accessToken
  const accessToken = afterUserVerified(user);
  res
    .status(HttpStatus.CREATED)
    .send({ data: { accessToken, user }, message: "login successfully" });
};

export default {
  signUpAccount,
  signupJoiSchema,
  resendOtpBodySchema,
  resendOTP,
  continueWithGoogle,
};
