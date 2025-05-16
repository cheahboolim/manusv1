import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/bookmarks',
    '/profile',
    '/settings',
    '/comic/*/read',
  ];
  
  // Admin-only routes
  const adminRoutes = [
    '/admin',
    '/admin/*',
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.endsWith('*')) {
      const basePath = route.slice(0, -1);
      return req.nextUrl.pathname.startsWith(basePath);
    }
    return req.nextUrl.pathname === route;
  });
  
  const isAdminRoute = adminRoutes.some(route => {
    if (route.endsWith('*')) {
      const basePath = route.slice(0, -1);
      return req.nextUrl.pathname.startsWith(basePath);
    }
    return req.nextUrl.pathname === route;
  });
  
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Check admin access for admin routes
  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  // Redirect to home if accessing auth pages while logged in
  if ((req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up') && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};
