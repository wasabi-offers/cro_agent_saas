import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "url is required" },
        { status: 400 }
      );
    }

    // Use ScreenshotAPI (free tier: 100 screenshots/month)
    // Alternative: ApiFlash, Urlbox, Screenshotone
    const screenshotApiUrl = `https://shot.screenshotapi.net/screenshot`;
    const params = new URLSearchParams({
      token: process.env.SCREENSHOT_API_TOKEN || 'demo', // Get free token at screenshotapi.net
      url: url,
      output: 'image',
      file_type: 'png',
      wait_for_event: 'load',
      full_page: 'true',
      fresh: 'true',
      width: '1200',
      retina: 'true',
    });

    console.log('📸 Capturing screenshot for:', url);

    const response = await fetch(`${screenshotApiUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Screenshot API failed: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${imageBase64}`,
      url: url,
    });
  } catch (error) {
    console.error("Screenshot capture error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to capture screenshot",
      },
      { status: 500 }
    );
  }
}
