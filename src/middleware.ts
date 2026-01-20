import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export function middleware(request: NextRequest) {
  // Serve tracking script directly with CORS headers
  if (request.nextUrl.pathname === '/cro-tracker.js') {
    try {
      const scriptPath = path.join(process.cwd(), 'public', 'cro-tracker.js');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');

      return new NextResponse(scriptContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    } catch (error) {
      return new NextResponse('// Tracking script not found', {
        status: 404,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }

    // Add CORS headers to all API responses
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/cro-tracker.js'],
};
