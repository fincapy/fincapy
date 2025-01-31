// middleware.js
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { getSession } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request) {
  let session = null;
  if (
    request.nextUrl.pathname.startsWith('/app') ||
    request.nextUrl.pathname === '/'
  ) {
    session = await getSession(request);

    if (request.nextUrl.pathname === '/') {
      if (session) {
        return NextResponse.redirect(new URL('/app', request.url));
      }
    } else {
      if (!session) {
        return NextResponse.redirect(new URL('/api/auth/login', request.url));
      }
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const prodCspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cdn.plaid.com;
    connect-src 'self' https://*.plaid.com;
    frame-src 'self' https://plaid.com https://*.plaid.com;
    child-src 'self' https://plaid.com https://*.plaid.com;
    style-src 'self' https: 'unsafe-inline';
    img-src 'self';
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

  const cspHeader = prodCspHeader;
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  if (process.env.NODE_ENV === 'production') {
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set(
      'Content-Security-Policy',
      contentSecurityPolicyHeaderValue
    );
  }

  if (session) {
    requestHeaders.set('x-tenant-id', session.user.tenant_id);
    requestHeaders.set('x-user-email', session.user.email);
    const cookies = request.cookies;
    const pageCookie = cookies.get('page');
    let page = 'spending';
    if (pageCookie) {
      if (pageCookie.value) {
        page = pageCookie.value;
      }
    }
    requestHeaders.set('x-page', page);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      contentSecurityPolicyHeaderValue
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
