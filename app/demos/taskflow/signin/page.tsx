import type { Metadata } from "next";
import { Suspense } from "react";
import { TaskflowSignInView } from "@/components/demos/taskflow/auth/SignInView";

export const metadata: Metadata = { title: "Sign in" };

export default function TaskflowSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 text-sm text-muted">
          Loading…
        </div>
      }
    >
      <TaskflowSignInView />
    </Suspense>
  );
}
