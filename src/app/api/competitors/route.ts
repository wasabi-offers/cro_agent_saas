import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data: competitors, error } = await supabase
      .from("competitors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching competitors:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      competitors: competitors || [],
    });
  } catch (error) {
    console.error("Error in GET /api/competitors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, website_url, description, category, notes, folder } = body;

    if (!name || !website_url) {
      return NextResponse.json(
        { success: false, error: "Name and website URL are required" },
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

    const newCompetitor = {
      id: `comp_${Date.now()}`,
      name,
      website_url,
      description: description || null,
      category: category || null,
      notes: notes || null,
      folder: folder || null,
      status: "active",
    };

    const { data, error } = await supabase
      .from("competitors")
      .insert(newCompetitor)
      .select()
      .single();

    if (error) {
      console.error("Error creating competitor:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      competitor: data,
      message: "Competitor added successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/competitors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, website_url, description, category, notes, status, folder } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Competitor ID is required" },
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

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (folder !== undefined) updateData.folder = folder;

    const { data, error } = await supabase
      .from("competitors")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating competitor:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      competitor: data,
      message: "Competitor updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/competitors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get("id");

    if (!competitorId) {
      return NextResponse.json(
        { success: false, error: "Competitor ID is required" },
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

    const { error } = await supabase
      .from("competitors")
      .delete()
      .eq("id", competitorId);

    if (error) {
      console.error("Error deleting competitor:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Competitor deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/competitors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
