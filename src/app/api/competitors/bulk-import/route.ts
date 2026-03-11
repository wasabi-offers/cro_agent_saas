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

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls, folder, category } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one URL is required" },
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

    const { data: existing } = await supabase
      .from("competitors")
      .select("website_url");

    const existingUrls = new Set(
      (existing || []).map((c) => {
        try {
          return new URL(c.website_url.startsWith("http") ? c.website_url : `https://${c.website_url}`).hostname.replace("www.", "");
        } catch {
          return c.website_url;
        }
      })
    );

    const results: { url: string; status: "created" | "duplicate" | "invalid" }[] = [];
    const toInsert: Record<string, unknown>[] = [];

    for (const rawUrl of urls) {
      const url = normalizeUrl(rawUrl);
      if (!url) {
        results.push({ url: rawUrl, status: "invalid" });
        continue;
      }

      const domain = extractDomain(url);

      if (existingUrls.has(domain)) {
        results.push({ url, status: "duplicate" });
        continue;
      }

      existingUrls.add(domain);

      const name = domain
        .split(".")[0]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      toInsert.push({
        id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        website_url: url,
        category: category || null,
        folder: folder || null,
        status: "active",
      });

      results.push({ url, status: "created" });
    }

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("competitors")
        .insert(toInsert);

      if (error) {
        console.error("Error bulk inserting competitors:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const duplicates = results.filter((r) => r.status === "duplicate").length;
    const invalid = results.filter((r) => r.status === "invalid").length;

    return NextResponse.json({
      success: true,
      results,
      summary: { created, duplicates, invalid, total: urls.length },
      message: `${created} competitor${created !== 1 ? "s" : ""} added${duplicates > 0 ? `, ${duplicates} duplicate${duplicates !== 1 ? "s" : ""} skipped` : ""}`,
    });
  } catch (error) {
    console.error("Error in POST /api/competitors/bulk-import:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
