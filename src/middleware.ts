import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // TEMPORARILY DISABLED - Allow all admin access
  // TODO: Re-enable after fixing cookie parsing
  return res;

  // Only protect /admin routes
  /*
  if (req.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Supabase auth cookies - try multiple patterns
      // Pattern 1: sb-<project-ref>-auth-token (main cookie)
      // Pattern 2: sb-<project-ref>-auth-token.0 and sb-<project-ref>-auth-token.1 (split cookies)
      const projectRef = 'eypgvkhylfrklwfnhaus';
      
      // Get all possible auth cookies
      const authCookie = req.cookies.get(`sb-${projectRef}-auth-token`);
      const authCookie0 = req.cookies.get(`sb-${projectRef}-auth-token.0`);
      const authCookie1 = req.cookies.get(`sb-${projectRef}-auth-token.1`);
      
      // Combine split cookies if they exist
      let authTokenValue = authCookie?.value;
      if (!authTokenValue && authCookie0 && authCookie1) {
        authTokenValue = authCookie0.value + authCookie1.value;
      } else if (!authTokenValue && authCookie0) {
        authTokenValue = authCookie0.value;
      }
      
      if (!authTokenValue) {
        // No auth cookie - redirect to login
        console.log('[Middleware] No auth cookie found, redirecting to login');
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      let accessToken: string;
      try {
        // Parse the cookie value - it's a JSON array with [access_token, refresh_token, ...]
        const authData = JSON.parse(authTokenValue);
        
        // Check if it's an array (new format) or object (old format)
        if (Array.isArray(authData)) {
          accessToken = authData[0]; // First element is access token
        } else if (typeof authData === 'object' && authData.access_token) {
          accessToken = authData.access_token;
        } else {
          // Use directly if it's a string
          accessToken = authData;
        }
      } catch {
        // If parsing fails, use the value directly (might be just the token string)
        accessToken = authTokenValue;
      }

      if (!accessToken || accessToken === 'null' || accessToken === 'undefined') {
        console.log('[Middleware] Invalid access token, redirecting to login');
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
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
        console.log('[Middleware] Invalid user token:', userError?.message);
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      console.log('[Middleware] User authenticated:', user.email);

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Can't get profile - redirect to access denied
        console.log('[Middleware] Profile error:', profileError?.message);
        return NextResponse.redirect(new URL('/access-denied', req.url));
      }

      console.log('[Middleware] User role:', profile.role);

      // Check if user is admin
      if ((profile as any).role !== 'admin') {
        // Not admin - redirect to access denied
        console.log('[Middleware] Access denied - not admin');
        const accessDeniedUrl = new URL('/access-denied', req.url);
        accessDeniedUrl.searchParams.set('required', 'admin');
        accessDeniedUrl.searchParams.set('current', (profile as any).role);
        return NextResponse.redirect(accessDeniedUrl);
      }

      // Admin user - allow access
      console.log('[Middleware] Admin access granted');
      return res;
    } catch (error) {
      console.error('[Middleware] Error:', error);
      // On error, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  */

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
