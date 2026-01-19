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
    // Use screenshotone.com API with element selector support
    // Free tier: 100 screenshots/month
    const apiUrl = new URL('https://api.screenshotone.com/take');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('selector', selector);
    apiUrl.searchParams.set('format', 'png');
    apiUrl.searchParams.set('viewport_width', '1920');
    apiUrl.searchParams.set('viewport_height', '1080');
    apiUrl.searchParams.set('device_scale_factor', '1');
    apiUrl.searchParams.set('image_quality', '80');
    apiUrl.searchParams.set('block_ads', 'true');
    apiUrl.searchParams.set('block_cookie_banners', 'true');
    apiUrl.searchParams.set('delay', '2');
    apiUrl.searchParams.set('response_type', 'by_format');

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

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
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
