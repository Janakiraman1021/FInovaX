import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const role = request.cookies.get('finovax-role')?.value;

    // Protect dashboard routes
    if (pathname.startsWith('/msme') || pathname.startsWith('/lender') || pathname.startsWith('/auditor')) {
        if (!role) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Role-specific protection
        if (pathname.startsWith('/msme') && role !== 'msme') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (pathname.startsWith('/lender') && role !== 'lender') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (pathname.startsWith('/auditor') && role !== 'auditor') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/msme/:path*', '/lender/:path*', '/auditor/:path*'],
};
