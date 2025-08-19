import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🔍 MIDDLEWARE RUNNING FOR:", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Get user session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log("👤 User:", user ? "authenticated" : "not authenticated");
    if (error) {
      console.log("❌ Auth error:", error.message);
    }

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/billing"];
    const authRoutes = ["/auth"];

    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route) &&
      !request.nextUrl.pathname.startsWith("/auth/callback")
    );

    const isRootRoute = request.nextUrl.pathname === "/";

    console.log("🛡️ Route checks:", {
      path: request.nextUrl.pathname,
      isProtectedRoute,
      isAuthRoute,
      isRootRoute,
      hasUser: !!user
    });

    // If user is not authenticated and trying to access protected route
    if (!user && isProtectedRoute) {
      console.log("🚫 Redirecting unauthenticated user to /auth");
      const redirectUrl = new URL("/auth", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // If user is authenticated and trying to access auth routes (except callback)
    if (user && isAuthRoute) {
      console.log("✅ Redirecting authenticated user to /dashboard");
      const redirectUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Handle root route redirection based on auth status
    if (isRootRoute) {
      if (user) {
        console.log("✅ Redirecting authenticated user from root to /dashboard");
        const redirectUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(redirectUrl);
      } else {
        console.log("🚫 Redirecting unauthenticated user from root to /auth");
        const redirectUrl = new URL("/auth", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("❌ Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};