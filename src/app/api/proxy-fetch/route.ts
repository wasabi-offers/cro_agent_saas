import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for XHR/fetch requests from proxied pages.
 * Bypasses CORS by fetching server-side - scripts in iframe can't call
 * cb.certifiedconcealedfirst.com etc. directly due to CORS.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(url);
    const res = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/120)',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': targetUrl.origin + '/',
      },
    });

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    console.error('proxy-fetch error:', e?.message);
    return NextResponse.json({ error: e?.message || 'Proxy failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(url);
    const body = await request.arrayBuffer();
    const contentType = request.headers.get('content-type') || 'application/x-www-form-urlencoded';

    const res = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/120)',
        'Accept': '*/*',
        'Content-Type': contentType,
        'Referer': targetUrl.origin + '/',
      },
      body,
    });

    const resContentType = res.headers.get('content-type') || 'application/octet-stream';
    const resBody = await res.arrayBuffer();

    return new NextResponse(resBody, {
      status: res.status,
      headers: {
        'Content-Type': resContentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    console.error('proxy-fetch POST error:', e?.message);
    return NextResponse.json({ error: e?.message || 'Proxy failed' }, { status: 500 });
  }
}
