import { NextResponse } from "next/server";

// This API provides heatmap data for landing pages
// Currently returns demo data, but will be connected to real tracking data

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const landingId = searchParams.get("landingId");

    if (!landingId) {
      return NextResponse.json(
        {
          success: false,
          error: "landingId is required",
        },
        { status: 400 }
      );
    }

    // TODO: Replace with real database query
    // const trackingData = await supabase
    //   .from('landing_tracking')
    //   .select('*')
    //   .eq('landing_id', landingId);

    // For now, return demo data
    // In production, this will fetch real user interaction data
    const heatmapData: Record<string, HeatmapData> = generateDemoHeatmapData();

    return NextResponse.json({
      success: true,
      landingId,
      ...heatmapData,
      generatedAt: new Date().toISOString(),
      source: "demo", // Will be "database" in production
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
