import { NextResponse } from "next/server";
import { fetchFunnels } from "@/lib/supabase-funnels";

export async function GET() {
  try {
    const funnels = await fetchFunnels();

    return NextResponse.json(funnels, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error("Error fetching funnels:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnels", details: error.message },
      { status: 500 }
    );
  }
}
