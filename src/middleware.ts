import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only protect /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Supabase stores auth in cookies with pattern: sb-<project-ref>-auth-token
      // The actual cookie structure contains access_token and refresh_token as JSON
      // We need to get the access token from the cookie
      const authCookie = req.cookies.get('sb-eypgvkhylfrklwfnhaus-auth-token');
      
      if (!authCookie) {
        // No auth cookie - redirect to login
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      let accessToken: string;
      try {
        // Parse the cookie value - it's a JSON string with access_token and refresh_token
        const authData = JSON.parse(authCookie.value);
        accessToken = authData.access_token || authData;
      } catch {
        // If parsing fails, use the value directly (might be just the token string)
        accessToken = authCookie.value;
      }

      // Create Supabase client with the access token
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );

      // Get user from token
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // Invalid token - redirect to login
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Can't get profile - redirect to access denied
        return NextResponse.redirect(new URL('/access-denied', req.url));
      }

      // Check if user is admin
      if (profile.role !== 'admin') {
        // Not admin - redirect to access denied
        const accessDeniedUrl = new URL('/access-denied', req.url);
        accessDeniedUrl.searchParams.set('required', 'admin');
        accessDeniedUrl.searchParams.set('current', profile.role);
        return NextResponse.redirect(accessDeniedUrl);
      }

      // Admin user - allow access
      return res;
    } catch (error) {
      console.error('Middleware error:', error);
      // On error, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // All other routes - allow access (no protection)
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
