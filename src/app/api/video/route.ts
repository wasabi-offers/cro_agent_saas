import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(url);

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': targetUrl.origin + '/',
        'Origin': targetUrl.origin,
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
      },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.arrayBuffer();

    // For HLS manifest files (.m3u8), rewrite URLs to go through the proxy
    if (contentType.includes('mpegurl') || contentType.includes('m3u8') || url.endsWith('.m3u8')) {
      let manifest = new TextDecoder().decode(body);
      const videoOrigin = targetUrl.origin;
      const videoBasePath = targetUrl.pathname.replace(/\/[^/]*$/, '/');

      // Rewrite relative and absolute URLs in the manifest
      const lines = manifest.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        
        // Skip comments and empty lines
        if (trimmed.startsWith('#') || trimmed === '') {
          // But check for URI= attributes in tags like #EXT-X-KEY
          if (trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (match, uri) => {
              const absoluteUrl = getAbsoluteUrl(uri, videoOrigin, videoBasePath);
              return `URI="${getProxyUrl(absoluteUrl)}"`;
            });
          }
          return line;
        }

        // This is a URL line
        const absoluteUrl = getAbsoluteUrl(trimmed, videoOrigin, videoBasePath);
        return getProxyUrl(absoluteUrl);
      });

      const rewrittenManifest = rewrittenLines.join('\n');

      return new NextResponse(rewrittenManifest, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For video segments (.ts, .mp4, etc.), just proxy them
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Video proxy error:', error.message);
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
