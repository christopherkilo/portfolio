import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/server/taskflow/types/database";

function normalizeUrl(raw: string) {
  return raw.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

export function createTaskflowBrowserClient() {
  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) {
    throw new Error(
      "TaskFlow Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createBrowserClient<Database>(url, key);
}
