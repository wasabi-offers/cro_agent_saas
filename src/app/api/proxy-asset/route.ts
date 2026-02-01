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

    // For CSS files, rewrite url() and @import references
    if (contentType.includes('text/css')) {
      let css = new TextDecoder().decode(body);
      const cssOrigin = targetUrl.origin;
      const cssBasePath = targetUrl.pathname.replace(/\/[^/]*$/, '/');

      const toAbs = (ref: string) => {
        if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
        if (ref.startsWith('//')) return 'https:' + ref;
        if (ref.startsWith('/')) return cssOrigin + ref;
        return cssOrigin + cssBasePath + ref;
      };
      const toProxy = (abs: string) => `/api/proxy-asset?url=${encodeURIComponent(abs)}`;

      // Rewrite @import url("...") or @import "..."
      css = css.replace(/@import\s+url\(["']?([^"')]+)["']?\)\s*;?/gi, (match, ref) => {
        if (ref.startsWith('data:') || ref.startsWith('#')) return match;
        return `@import url("${toProxy(toAbs(ref))}");`;
      });
      css = css.replace(/@import\s+["']([^"']+)["']\s*;?/gi, (match, ref) => {
        if (ref.startsWith('data:') || ref.startsWith('#')) return match;
        return `@import url("${toProxy(toAbs(ref))}");`;
      });

      css = css.replace(/url\(["']?(?!data:)([^"')]+)["']?\)/gi, (match, ref) => {
        if (ref.startsWith('data:') || ref.startsWith('#')) return match;
        return `url("${toProxy(toAbs(ref))}")`;
      });

      return new NextResponse(css, {
        status: 200,
        headers: {
          'Content-Type': 'text/css; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
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
    console.error('Proxy asset error:', error.message);
    return new NextResponse(null, { status: 500 });
  }
}
