import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    const targetUrl = new URL(url);

    // Fetch the page
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    let html = await response.text();

    // Inject base tag to handle relative URLs
    const baseTag = `<base href="${targetUrl.origin}${targetUrl.pathname}" target="_blank">`;

    // Remove all script tags to prevent CORS errors and unwanted JS execution
    // This is for preview only - we just need the visual HTML+CSS
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*\/>/gi, '');

    // Remove video/audio autoplay
    html = html.replace(/autoplay/gi, 'data-noautoplay');

    // Mute all video/audio elements
    html = html.replace(/<video/gi, '<video muted');
    html = html.replace(/<audio/gi, '<audio muted');

    html = html.replace('<head>', `<head>${baseTag}`);

    // Return HTML without X-Frame-Options
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Remove X-Frame-Options to allow iframe
        'X-Frame-Options': 'ALLOWALL',
        // Set CSP to allow embedding
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: `Failed to proxy page: ${error.message}` },
      { status: 500 }
    );
  }
}
