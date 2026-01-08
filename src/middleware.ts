import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Middleware] Missing Supabase environment variables. ' +
      'Check .env.local and restart the dev server.'
    );
    // Return a response that will show an error
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase credentials' },
      { status: 500 }
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  // Refresh session before checking user
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  // Debug: Log what cookies we see
  const allCookies = request.cookies.getAll();
  const supabaseCookies = allCookies.filter(c => 
    c.name.includes('supabase') || c.name.includes('auth') || c.name.includes('sb-')
  );
  console.log('[MIDDLEWARE] Cookies found:', supabaseCookies.length, 'Supabase cookies');
  console.log('[MIDDLEWARE] Session exists:', !!session);
  console.log('[MIDDLEWARE] User exists:', !!user);
  
  if (authError) {
    console.log('[MIDDLEWARE] Auth error:', authError.message);
    console.log('[MIDDLEWARE] Auth error code:', authError.status);
  }

  // Protect /app routes
  if (request.nextUrl.pathname.startsWith('/app')) {
    if (!user) {
      console.log('[MIDDLEWARE] No user, redirecting to login');
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    console.log('[MIDDLEWARE] User authenticated:', user.email);
  }

  // Redirect authenticated users away from /login
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return supabaseResponse;
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

