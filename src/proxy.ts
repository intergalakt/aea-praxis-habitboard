import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthConfigured } from "@/features/auth/auth.rules";

const AUTH_PATHS = ["/login", "/signup"];
const PROTECTED_PREFIX = "/dashboard";

/**
 * Erste Verteidigungslinie (AC-6). Die Autorisierung selbst entscheidet
 * (protected)/layout.tsx mit getUser() — hier wird nur billig abgewiesen und
 * das Session-Cookie frisch gehalten.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`);

  const toLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = isProtected ? `?next=${encodeURIComponent(pathname + search)}` : "";
    return NextResponse.redirect(url);
  };

  // Ohne gültige Konfiguration gibt es keine Session: geschützte Routen zu (AC-9).
  if (!isAuthConfigured()) {
    return isProtected ? toLogin() : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) return toLogin();

  if (user && AUTH_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};

export default proxy;
