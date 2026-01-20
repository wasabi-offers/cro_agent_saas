import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const selector = searchParams.get('selector');

  if (!url || !selector) {
    return NextResponse.json(
      { error: 'URL and selector parameters are required' },
      { status: 400 }
    );
  }

  try {
    // Use microlink.io API with element selector support
    // Free tier: 50 requests/day per IP
    const apiUrl = new URL('https://api.microlink.io/screenshot');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('element', selector);
    apiUrl.searchParams.set('type', 'png');
    apiUrl.searchParams.set('viewport.width', '1920');
    apiUrl.searchParams.set('viewport.height', '1080');
    apiUrl.searchParams.set('waitUntil', 'networkidle0');
    apiUrl.searchParams.set('device', 'desktop');

    console.log('Fetching screenshot:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log('Screenshot API response status:', response.status);

    if (!response.ok) {
      throw new Error(`Screenshot API returned ${response.status}`);
    }

    const data = await response.json();

    // Microlink returns JSON with screenshot URL
    if (data.status === 'success' && data.data?.screenshot?.url) {
      const imageResponse = await fetch(data.data.screenshot.url);
      const imageBuffer = await imageResponse.arrayBuffer();

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } else {
      throw new Error('Screenshot not found in response');
    }
  } catch (error: any) {
    console.error('Screenshot error:', error);

    // Return placeholder image
    return new NextResponse(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
        },
      }
    );
  }
}
