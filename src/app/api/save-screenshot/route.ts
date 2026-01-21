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
    return process.env.SCREENSHOT_API_TOKEN || 'demo';
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'screenshot_api_access_key')
      .single();

    if (error || !data) {
      return process.env.SCREENSHOT_API_TOKEN || 'demo';
    }

    return data.setting_value;
  } catch (error) {
    return process.env.SCREENSHOT_API_TOKEN || 'demo';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { funnelId, stepId, url } = body;

    if (!funnelId || !stepId || !url) {
      return NextResponse.json(
        { success: false, error: "funnelId, stepId, and url are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    // Get access key
    const accessKey = await getScreenshotApiAccessKey();

    // Capture screenshot
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

    console.log('📸 Capturing screenshot for step:', stepId, url);

    const response = await fetch(`${screenshotApiUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Screenshot API failed: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Upload to Supabase Storage
    const fileName = `funnel_${funnelId}/step_${stepId}_${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);

    const screenshotUrl = publicUrlData.publicUrl;

    // Update funnel_steps table
    const { error: updateError } = await supabase
      .from('funnel_steps')
      .update({
        screenshot_url: screenshotUrl,
        screenshot_captured_at: new Date().toISOString(),
      })
      .eq('id', stepId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update step: ${updateError.message}`);
    }

    console.log('✅ Screenshot saved:', screenshotUrl);

    return NextResponse.json({
      success: true,
      screenshotUrl,
      stepId,
    });
  } catch (error) {
    console.error("Save screenshot error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save screenshot",
      },
      { status: 500 }
    );
  }
}
