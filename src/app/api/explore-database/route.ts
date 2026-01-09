import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// API to explore database structure
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get list of tables by querying information_schema
    // Note: This requires proper permissions
    const tables: Record<string, unknown> = {};

    // Try to fetch from common CRO-related table names
    const possibleTables = [
      'clarity_sessions',
      'clarity_recordings', 
      'clarity_heatmaps',
      'clarity_data',
      'crazy_egg_sessions',
      'crazy_egg_heatmaps',
      'crazy_egg_data',
      'sessions',
      'recordings',
      'heatmaps',
      'events',
      'pageviews',
      'clicks',
      'scrolls',
      'conversions',
      'funnels',
      'users',
      'visitors',
      'analytics',
      'metrics',
    ];

    for (const tableName of possibleTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: false })
          .limit(5);

        if (!error && data) {
          // Get column names from first row
          const columns = data.length > 0 ? Object.keys(data[0]) : [];
          tables[tableName] = {
            exists: true,
            rowCount: count,
            columns,
            sampleData: data,
          };
        }
      } catch {
        // Table doesn't exist, skip
      }
    }

    return NextResponse.json({
      success: true,
      supabaseUrl,
      tables,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database exploration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
