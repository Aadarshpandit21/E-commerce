declare module "apple-signin-auth" {
  export type AppleIdTokenType = any;

  export interface VerifyOptions {
    audience?: string | string[];
    ignoreExpiration?: boolean;
    [key: string]: any;
  }

  export function verifyIdToken(idToken: string, options?: VerifyOptions): Promise<AppleIdTokenType>;

  export {};
}
