import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Get screenshot API access key from database
async function getScreenshotApiAccessKey(): Promise<string> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn('Supabase not configured, using env token');
    return process.env.SCREENSHOT_API_TOKEN || 'demo';
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'screenshot_api_access_key')
      .single();

    if (error || !data) {
      console.warn('Failed to fetch access key from database, using env token');
      return process.env.SCREENSHOT_API_TOKEN || 'demo';
    }

    return data.setting_value;
  } catch (error) {
    console.error('Error fetching screenshot access key:', error);
    return process.env.SCREENSHOT_API_TOKEN || 'demo';
  }
}

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

    // Get access key from database
    const accessKey = await getScreenshotApiAccessKey();

    // Use ScreenshotAPI (free tier: 100 screenshots/month)
    // Alternative: ApiFlash, Urlbox, Screenshotone
    const screenshotApiUrl = `https://shot.screenshotapi.net/screenshot`;
    const params = new URLSearchParams({
      token: accessKey,
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
    console.log('🔑 Using access key:', accessKey.substring(0, 10) + '...');

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
