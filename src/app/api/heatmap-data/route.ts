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
    const landingId = searchParams.get("landingId");
    const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = searchParams.get("dateTo") || new Date().toISOString();

    if (!landingId) {
      return NextResponse.json(
        {
          success: false,
          error: "landingId is required",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Try to fetch real data from database
    if (supabase) {
      try {
        console.log(`📊 Fetching heatmap data for landing ${landingId} from ${dateFrom} to ${dateTo}`);

        // Fetch from pre-aggregated table for performance
        const { data: heatmapData, error } = await supabase
          .from('tracking_heatmap_data')
          .select('event_type, x_position, y_position, intensity')
          .eq('landing_id', landingId)
          .gte('date', dateFrom.split('T')[0])
          .lte('date', dateTo.split('T')[0]);

        if (error) {
          console.error("❌ Supabase error:", error);
          // Fall back to demo data
        } else if (heatmapData && heatmapData.length > 0) {
          console.log(`✅ Found ${heatmapData.length} aggregated data points`);

          // Transform database data to heatmap format
          const clickPoints: HeatmapPoint[] = [];
          const movementPoints: HeatmapPoint[] = [];
          let maxClick = 0;
          let maxMovement = 0;

          heatmapData.forEach(point => {
            const heatmapPoint: HeatmapPoint = {
              x: point.x_position,
              y: point.y_position,
              value: point.intensity,
            };

            if (point.event_type === 'click') {
              clickPoints.push(heatmapPoint);
              maxClick = Math.max(maxClick, point.intensity);
            } else if (point.event_type === 'movement') {
              movementPoints.push(heatmapPoint);
              maxMovement = Math.max(maxMovement, point.intensity);
            }
          });

          // Fetch scroll data separately (not aggregated)
          const { data: scrollData, error: scrollError } = await supabase
            .from('tracking_events')
            .select('y_position, scroll_percentage')
            .eq('landing_id', landingId)
            .eq('event_type', 'scroll')
            .gte('created_at', dateFrom)
            .lte('created_at', dateTo)
            .limit(500);

          const scrollPoints: HeatmapPoint[] = [];
          let maxScroll = 0;

          if (scrollData && scrollData.length > 0) {
            // Group scroll events by y position bands
            const scrollBands: Record<number, number> = {};

            scrollData.forEach(scroll => {
              const band = Math.floor(scroll.y_position / 50) * 50; // 50px bands
              scrollBands[band] = (scrollBands[band] || 0) + 1;
            });

            Object.entries(scrollBands).forEach(([y, count]) => {
              scrollPoints.push({
                x: 600, // Center x position
                y: parseInt(y),
                value: count,
              });
              maxScroll = Math.max(maxScroll, count);
            });
          }

          return NextResponse.json({
            success: true,
            landingId,
            click: {
              type: "click",
              points: clickPoints,
              max: maxClick || 100,
            },
            scroll: {
              type: "scroll",
              points: scrollPoints,
              max: maxScroll || 100,
            },
            movement: {
              type: "movement",
              points: movementPoints,
              max: maxMovement || 100,
            },
            generatedAt: new Date().toISOString(),
            source: "database",
            stats: {
              totalClicks: clickPoints.length,
              totalMovements: movementPoints.length,
              totalScrolls: scrollPoints.length,
            },
          });
        }
      } catch (dbError) {
        console.error("❌ Database error:", dbError);
        // Fall through to demo data
      }
    }

    // Fallback: return demo data if no real data or database not configured
    console.log("📊 Using demo heatmap data");
    const heatmapData: Record<string, HeatmapData> = generateDemoHeatmapData();

    return NextResponse.json({
      success: true,
      landingId,
      ...heatmapData,
      generatedAt: new Date().toISOString(),
      source: "demo",
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
