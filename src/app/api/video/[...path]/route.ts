import { NextRequest, NextResponse } from 'next/server';

// Catch-all route for video paths that get resolved incorrectly by HLS players
// This handles cases like /api/video/TS_h264_variant.m3u8 when the player
// resolves relative URLs from the manifest incorrectly

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Check if there's a referer with the original video URL
  const referer = request.headers.get('referer');
  const path = params.path?.join('/') || '';
  
  // Try to extract the base URL from the referer or reconstruct from path
  let targetUrl: string | null = null;

  // Check query params first - maybe the URL was passed correctly
  const urlParam = request.nextUrl.searchParams.get('url');
  if (urlParam) {
    targetUrl = urlParam;
  }

  // If we have a path, try to find the original base URL from referer
  if (!targetUrl && referer && path) {
    try {
      const refererUrl = new URL(referer);
      // Look for the original proxy URL in the referer's query
      const originalUrl = refererUrl.searchParams.get('url');
      if (originalUrl) {
        const baseUrl = new URL(originalUrl);
        const basePath = baseUrl.pathname.replace(/\/[^/]*$/, '/');
        targetUrl = baseUrl.origin + basePath + path;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Last resort: return 404 with helpful message
  if (!targetUrl) {
    console.error('Video catch-all: could not determine target URL', {
      path,
      referer,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });
    return new NextResponse(null, { status: 404 });
  }

  try {
    const url = new URL(targetUrl);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': url.origin + '/',
        'Origin': url.origin,
      },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.arrayBuffer();

    // For HLS manifest files, rewrite URLs
    if (contentType.includes('mpegurl') || contentType.includes('m3u8') || targetUrl.endsWith('.m3u8')) {
      let manifest = new TextDecoder().decode(body);
      const videoOrigin = url.origin;
      const videoBasePath = url.pathname.replace(/\/[^/]*$/, '/');

      const lines = manifest.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('#') || trimmed === '') {
          if (trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (match, uri) => {
              const absoluteUrl = getAbsoluteUrl(uri, videoOrigin, videoBasePath);
              return `URI="${getProxyUrl(absoluteUrl)}"`;
            });
          }
          return line;
        }

        const absoluteUrl = getAbsoluteUrl(trimmed, videoOrigin, videoBasePath);
        return getProxyUrl(absoluteUrl);
      });

      return new NextResponse(rewrittenLines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Video catch-all error:', error.message);
    return new NextResponse(null, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

function getAbsoluteUrl(ref: string, origin: string, basePath: string): string {
  if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
  if (ref.startsWith('//')) return 'https:' + ref;
  if (ref.startsWith('/')) return origin + ref;
  return origin + basePath + ref;
}

function getProxyUrl(absoluteUrl: string): string {
  return `/api/video?url=${encodeURIComponent(absoluteUrl)}`;
}
