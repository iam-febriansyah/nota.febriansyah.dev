import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = req.cookies.get('token')?.value;

  if (!token) {
    // Redirect to login if no token
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = verifyToken(token);

  if (!payload) {
    // Redirect to login if invalid token
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('token');
    return response;
  }

  // Role-based access control (Basic example)
  if (pathname.startsWith('/admin') && payload.role !== 'Superadmin') {
     return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (pathname.startsWith('/finance') && payload.role !== 'Finance' && payload.role !== 'Superadmin') {
     return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  if (pathname.startsWith('/dealer') && payload.role !== 'Dealer' && payload.role !== 'Superadmin') {
     return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
