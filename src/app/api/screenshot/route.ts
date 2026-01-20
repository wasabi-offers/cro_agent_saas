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
    // Use screenshotapi.net with element selector
    const apiUrl = new URL('https://shot.screenshotapi.net/screenshot');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('selector', selector);
    apiUrl.searchParams.set('output', 'image');
    apiUrl.searchParams.set('file_type', 'png');
    apiUrl.searchParams.set('wait_for_event', 'load');
    apiUrl.searchParams.set('delay', '3000');
    apiUrl.searchParams.set('full_page', 'false');

    console.log('Fetching screenshot with selector:', selector);
    console.log('API URL:', apiUrl.toString());

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
