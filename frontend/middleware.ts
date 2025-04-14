import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./utils/supabase/server";

// Define public routes that don't require authentication
const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/terms-of-service',
];

// Define routes that should redirect to home if authenticated
const authRoutes = [
  '/sign-in',
  '/sign-up',
  '/auth',
  '/forgot-password',
  '/reset-password',
];

export async function middleware(req: NextRequest) {
  try {
    // Create response early to modify later
    const res = NextResponse.next();
    const supabase = await createClient();

    // Get session and handle potential errors
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      // Clear any existing session cookies on error
      res.cookies.delete('sb-access-token');
      return redirectToSignIn(req);
    }

    // Get the path from the request URL
    const path = req.nextUrl.pathname;

    // Handle session token refresh and cookie management
    if (session?.access_token) {
      // Set the access token cookie with secure attributes
      res.cookies.set("sb-access-token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });

      // If user is authenticated and tries to access auth routes, redirect to home
      if (authRoutes.some(route => path.startsWith(route))) {
        return redirectToHome(req);
      }
    }

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

    // Handle protected routes
    if (!session && !isPublicRoute) {
      // Store the attempted URL to redirect back after login
      const redirectUrl = req.nextUrl.clone();
      return redirectToSignIn(req, redirectUrl.pathname);
    }

    // Allow the request to proceed
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // On critical errors, redirect to sign in
    return redirectToSignIn(req);
  }
}

// Helper function to create sign in redirect
function redirectToSignIn(req: NextRequest, returnTo?: string) {
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  if (returnTo) {
    redirectUrl.searchParams.set("returnTo", returnTo);
  }
  return NextResponse.redirect(redirectUrl);
}

// Helper function to create home redirect
function redirectToHome(req: NextRequest) {
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/";
  return NextResponse.redirect(redirectUrl);
}

// Specify which routes should be handled by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that handle their own auth
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|api/).*)",
  ],
};
