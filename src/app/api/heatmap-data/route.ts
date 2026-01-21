import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This API provides heatmap data for landing pages

interface HeatmapPoint {
  x: number;
  y: number;
  value: number; // Intensity
}

interface HeatmapData {
  type: "click" | "scroll" | "movement";
  points: HeatmapPoint[];
  max: number; // Max value for normalization
}

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get("funnelId") || searchParams.get("landingId"); // Support both
    const stepName = searchParams.get("stepName");
    const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = searchParams.get("dateTo") || new Date().toISOString();

    console.log('=====================================');
    console.log('🔥 GET /api/heatmap-data');
    console.log('Funnel ID:', funnelId);
    console.log('Step Name:', stepName);
    console.log('Date Range:', dateFrom, 'to', dateTo);

    if (!funnelId) {
      return NextResponse.json(
        {
          success: false,
          error: "funnelId is required",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        console.log('📊 Fetching heatmap data from tracking_events...');

        // Build query
        let query = supabase
          .from('tracking_events')
          .select('event_type, click_x, click_y, mouse_x, mouse_y, scroll_depth')
          .eq('funnel_id', funnelId)
          .gte('timestamp', new Date(dateFrom).getTime())
          .lte('timestamp', new Date(dateTo).getTime());

        // Filter by step if provided
        if (stepName) {
          query = query.eq('funnel_step_name', stepName);
        }

        const { data: events, error } = await query.limit(10000);

        console.log('Query error:', error);
        console.log('Events found:', events?.length || 0);

        if (error) {
          console.error("❌ Supabase error:", error);
          throw error;
        }

        if (events && events.length > 0) {
          console.log('✅ Found', events.length, 'tracking events');
          console.log('Sample event:', events[0]);

          // Process events into heatmap data
          const clickPoints: HeatmapPoint[] = [];
          const movementPoints: HeatmapPoint[] = [];
          const scrollPoints: HeatmapPoint[] = [];

          let maxClick = 0;
          let maxMovement = 0;
          let maxScroll = 0;

          // Count occurrences at each position for intensity
          const clickMap: Record<string, number> = {};
          const moveMap: Record<string, number> = {};
          const scrollBands: Record<number, number> = {};

          events.forEach(event => {
            // Process click events
            if ((event.event_type === 'click' || event.event_type === 'cta_click') && event.click_x && event.click_y) {
              const key = `${Math.floor(event.click_x / 10)}_${Math.floor(event.click_y / 10)}`; // 10px grid
              clickMap[key] = (clickMap[key] || 0) + 1;
            }

            // Process mouse movement events
            if (event.event_type === 'mousemove' && event.mouse_x && event.mouse_y) {
              const key = `${Math.floor(event.mouse_x / 20)}_${Math.floor(event.mouse_y / 20)}`; // 20px grid
              moveMap[key] = (moveMap[key] || 0) + 1;
            }

            // Process scroll events
            if (event.event_type === 'scroll' && event.scroll_depth) {
              const band = Math.floor(event.scroll_depth / 50) * 50; // 50px bands
              scrollBands[band] = (scrollBands[band] || 0) + 1;
            }
          });

          // Convert maps to points
          Object.entries(clickMap).forEach(([key, count]) => {
            const [x, y] = key.split('_').map(v => parseInt(v) * 10);
            clickPoints.push({ x, y, value: count });
            maxClick = Math.max(maxClick, count);
          });

          Object.entries(moveMap).forEach(([key, count]) => {
            const [x, y] = key.split('_').map(v => parseInt(v) * 20);
            movementPoints.push({ x, y, value: count });
            maxMovement = Math.max(maxMovement, count);
          });

          Object.entries(scrollBands).forEach(([y, count]) => {
            scrollPoints.push({ x: 600, y: parseInt(y), value: count });
            maxScroll = Math.max(maxScroll, count);
          });

          console.log('📊 Heatmap stats:');
          console.log('  Click points:', clickPoints.length, '(max:', maxClick, ')');
          console.log('  Movement points:', movementPoints.length, '(max:', maxMovement, ')');
          console.log('  Scroll bands:', scrollPoints.length, '(max:', maxScroll, ')');

          const response = {
            success: true,
            funnelId,
            stepName: stepName || 'all',
            click: {
              type: "click" as const,
              points: clickPoints,
              max: maxClick || 1,
            },
            scroll: {
              type: "scroll" as const,
              points: scrollPoints,
              max: maxScroll || 1,
            },
            movement: {
              type: "movement" as const,
              points: movementPoints,
              max: maxMovement || 1,
            },
            generatedAt: new Date().toISOString(),
            source: "database",
            stats: {
              totalClicks: clickPoints.length,
              totalMovements: movementPoints.length,
              totalScrolls: scrollPoints.length,
            },
          };

          console.log('✅ Returning heatmap data:', response.stats);
          console.log('=====================================');

          return NextResponse.json(response);
        }

        console.log('⚠️ No events found');
      } catch (dbError) {
        console.error("❌ Database error:", dbError);
      }
    }

    // NO DEMO DATA - return empty
    console.log("📊 No real data available");
    console.log('=====================================');

    return NextResponse.json({
      success: true,
      funnelId,
      click: { type: "click", points: [], max: 1 },
      scroll: { type: "scroll", points: [], max: 1 },
      movement: { type: "movement", points: [], max: 1 },
      generatedAt: new Date().toISOString(),
      source: "empty",
      stats: {
        totalClicks: 0,
        totalMovements: 0,
        totalScrolls: 0,
      },
    });
  } catch (error) {
    console.error("Heatmap data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

function generateDemoHeatmapData(): Record<string, HeatmapData> {
  const width = 1200;
  const height = 800;

  const clickPoints: HeatmapPoint[] = [];
  const scrollPoints: HeatmapPoint[] = [];
  const movementPoints: HeatmapPoint[] = [];

  // Generate demo click hotspots
  // Hero CTA
  for (let i = 0; i < 150; i++) {
    clickPoints.push({
      x: 600 + Math.random() * 100 - 50,
      y: 200 + Math.random() * 40 - 20,
      value: Math.random() * 50 + 50,
    });
  }

  // Navigation clicks
  for (let i = 0; i < 80; i++) {
    clickPoints.push({
      x: 200 + Math.random() * 800,
      y: 50 + Math.random() * 20,
      value: Math.random() * 30 + 20,
    });
  }

  // Pricing cards clicks
  for (let i = 0; i < 120; i++) {
    clickPoints.push({
      x: 400 + Math.random() * 400,
      y: 450 + Math.random() * 80,
      value: Math.random() * 40 + 30,
    });
  }

  // Footer clicks (scattered)
  for (let i = 0; i < 40; i++) {
    clickPoints.push({
      x: Math.random() * width,
      y: height - 100 + Math.random() * 80,
      value: Math.random() * 20 + 10,
    });
  }

  // Dead click zone (users clicking on non-clickable element)
  for (let i = 0; i < 60; i++) {
    clickPoints.push({
      x: 300 + Math.random() * 80,
      y: 350 + Math.random() * 60,
      value: Math.random() * 25 + 15,
    });
  }

  // Generate demo scroll depth (horizontal bars)
  for (let y = 0; y < height; y += 5) {
    const intensity = Math.max(0, 100 - (y / height) * 150); // Decreases with depth
    for (let i = 0; i < 50; i++) {
      scrollPoints.push({
        x: Math.random() * width,
        y: y + Math.random() * 10,
        value: intensity + Math.random() * 20,
      });
    }
  }

  // Generate demo mouse movement hotspots
  // Hero area (high attention)
  for (let i = 0; i < 200; i++) {
    movementPoints.push({
      x: 400 + Math.random() * 400,
      y: 150 + Math.random() * 200,
      value: Math.random() * 40 + 30,
    });
  }

  // Pricing cards (users comparing)
  for (let i = 0; i < 150; i++) {
    movementPoints.push({
      x: 300 + Math.random() * 600,
      y: 400 + Math.random() * 150,
      value: Math.random() * 50 + 40,
    });
  }

  // Navigation area
  for (let i = 0; i < 100; i++) {
    movementPoints.push({
      x: Math.random() * width,
      y: 30 + Math.random() * 50,
      value: Math.random() * 35 + 25,
    });
  }

  return {
    click: { type: "click", points: clickPoints, max: 100 },
    scroll: { type: "scroll", points: scrollPoints, max: 120 },
    movement: { type: "movement", points: movementPoints, max: 80 },
  };
}
