    import { auth } from '@/lib/auth'
    import { NextResponse } from 'next/server'

    export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { pathname } = req.nextUrl

    // Public routes
    const isPublicRoute = 
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/api/auth')

    // Protected routes
    const isProtectedRoute = 
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/datasets') ||
        pathname.startsWith('/visualizations') ||
        pathname.startsWith('/upload') ||
        pathname.startsWith('/settings')

    // Redirect to login if accessing protected route while logged out
    if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect to dashboard if accessing auth pages while logged in
    if ((pathname === '/login' || pathname === '/register') && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
    })

    export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
    }