import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Check for token with the configured secret
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  
  // API routes and static assets that should be accessible
  const isApiOrStaticRoute = 
    request.nextUrl.pathname.startsWith('/api') || 
    request.nextUrl.pathname.startsWith('/_next') || 
    request.nextUrl.pathname === '/favicon.ico'
  
  // Protected routes that require authentication
  const isProtectedRoute = 
    request.nextUrl.pathname === '/dashboard' ||
    request.nextUrl.pathname.startsWith('/dashboard/') ||
    request.nextUrl.pathname === '/profile' ||
    request.nextUrl.pathname.startsWith('/profile/') ||
    request.nextUrl.pathname.startsWith('/workout') ||
    request.nextUrl.pathname.startsWith('/exercises')
  
  // Always allow API and static routes
  if (isApiOrStaticRoute) {
    return NextResponse.next()
  }
  
  // Check if the route is in the public routes list
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // Redirect authenticated users away from public routes (like login)
  if (isPublicRoute) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }
  
  // Require authentication for protected routes
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url)
    // Save the requested URL to redirect back after login
    url.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Define routes to apply the middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 