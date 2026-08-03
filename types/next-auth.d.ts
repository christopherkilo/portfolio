import type { DefaultSession } from "next-auth";

export type AuthProviderId = "google" | "github";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      /** Most recently updated linked OAuth provider. */
      provider?: AuthProviderId | null;
    };
  }
}
