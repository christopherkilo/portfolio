import type { Metadata } from "next";
import { SignInClient } from "@/components/demos/event-horizon/auth/SignInClient";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to save favorites and reserve Event Horizon tickets.",
};

export default function SignInPage() {
  return <SignInClient />;
}
