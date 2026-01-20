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
    // First, fetch the page HTML through our proxy to inject element highlighting
    const proxyUrl = `${request.nextUrl.origin}/api/proxy-page?url=${encodeURIComponent(url)}`;
    const pageResponse = await fetch(proxyUrl);
    const htmlContent = await pageResponse.text();

    // Inject CSS and JavaScript to highlight the target element
    const highlightScript = `
      <style>
        ${selector} {
          outline: 4px solid #00d4aa !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 20px rgba(0, 212, 170, 0.5) !important;
          background-color: rgba(0, 212, 170, 0.1) !important;
        }
      </style>
      <script>
        window.addEventListener('load', function() {
          const element = document.querySelector('${selector.replace(/'/g, "\\'")}');
          if (element) {
            element.scrollIntoView({ behavior: 'instant', block: 'center' });
          }
        });
      </script>
    `;

    // Inject the highlight script before </head>
    const modifiedHtml = htmlContent.replace('</head>', highlightScript + '</head>');

    // Create a data URL with the modified HTML
    const dataUrl = `data:text/html;base64,${Buffer.from(modifiedHtml).toString('base64')}`;

    // Now screenshot this modified page
    const apiUrl = new URL('https://shot.screenshotapi.net/screenshot');
    apiUrl.searchParams.set('url', dataUrl);
    apiUrl.searchParams.set('output', 'image');
    apiUrl.searchParams.set('file_type', 'png');
    apiUrl.searchParams.set('wait_for_event', 'load');
    apiUrl.searchParams.set('delay', '2000');
    apiUrl.searchParams.set('full_page', 'false');
    apiUrl.searchParams.set('width', '1920');
    apiUrl.searchParams.set('height', '1080');

    console.log('Fetching screenshot with highlighted element:', selector);

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
