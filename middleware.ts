import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function normalizeUrl(raw: string) {
  return raw.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isTaskflow =
    path.startsWith("/demos/taskflow") ||
    path.startsWith("/api/workspaces") ||
    path.startsWith("/api/projects") ||
    path.startsWith("/api/tasks") ||
    path.startsWith("/api/activity") ||
    path.startsWith("/api/members") ||
    path.startsWith("/api/me") ||
    path.startsWith("/api/taskflow");
  const isAuthRoute =
    path.startsWith("/demos/taskflow/signin") ||
    path.startsWith("/demos/taskflow/invite") ||
    path.startsWith("/auth/callback");

  if (isTaskflow && !isAuthRoute && !path.startsWith("/api/") && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/demos/taskflow/signin";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    "/demos/taskflow/:path*",
    "/api/workspaces/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
    "/api/activity/:path*",
    "/api/members/:path*",
    "/api/me",
    "/api/taskflow/:path*",
    "/auth/callback",
  ],
};
