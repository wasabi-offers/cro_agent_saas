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
    // Use Screenshotmachine.com free tier (1000 screenshots/month)
    // Format: https://api.screenshotmachine.com?key=YOUR_KEY&url=URL&dimension=1920x1080&device=desktop&format=png&cacheLimit=0&delay=2000

    // Alternative free service: shot.screenshotapi.net
    const screenshotApiUrl = `https://shot.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&output=image&file_type=png&wait_for_event=load&delay=2000&full_page=false&fresh=true`;

    const response = await fetch(screenshotApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

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
