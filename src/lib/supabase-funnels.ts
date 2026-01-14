import { supabase, isSupabaseConfigured } from "./supabase";

// ============================================
// TYPES
// ============================================

export interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
  url?: string;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
}

export interface FunnelStepDB {
  id: string;
  funnel_id: string;
  name: string;
  url: string | null;
  visitors: number;
  dropoff: number;
  step_order: number;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
}

export interface FunnelDB {
  id: string;
  name: string;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  description: string | null;
}

export interface FunnelConnectionDB {
  id: string;
  funnel_id: string;
  source_step_id: string;
  target_step_id: string;
  created_at: string;
}

// ============================================
// MOCK DATA FOR DEVELOPMENT (when Supabase not configured)
// ============================================

function getMockFunnels(): ConversionFunnel[] {
  return [
    {
      id: "funnel_1",
      name: "E-commerce Checkout",
      conversionRate: 24.5,
      steps: [
        { name: "Landing Page", visitors: 10000, dropoff: 0, url: "https://example.com" },
        { name: "Product Page", visitors: 7500, dropoff: 25, url: "https://example.com/product" },
        { name: "Add to Cart", visitors: 5000, dropoff: 33.3, url: "https://example.com/cart" },
        { name: "Checkout", visitors: 3000, dropoff: 40, url: "https://example.com/checkout" },
        { name: "Thank You", visitors: 2450, dropoff: 18.3, url: "https://example.com/thanks" },
      ],
    },
    {
      id: "funnel_2",
      name: "SaaS Free Trial",
      conversionRate: 18.3,
      steps: [
        { name: "Homepage", visitors: 8000, dropoff: 0, url: "https://saas.example.com" },
        { name: "Pricing Page", visitors: 5600, dropoff: 30, url: "https://saas.example.com/pricing" },
        { name: "Sign Up", visitors: 3360, dropoff: 40, url: "https://saas.example.com/signup" },
        { name: "Onboarding", visitors: 2016, dropoff: 40, url: "https://saas.example.com/onboarding" },
        { name: "Trial Started", visitors: 1464, dropoff: 27.4, url: "https://saas.example.com/trial" },
      ],
    },
  ];
}

// ============================================
// FETCH FUNNELS
// ============================================

export async function fetchFunnels(): Promise<ConversionFunnel[]> {
  // Use mock data if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.log("📊 Using mock funnels data (Supabase not configured)");
    return getMockFunnels();
  }

  try {
    // Fetch all funnels
    const { data: funnelsData, error: funnelsError } = await supabase
      .from("funnels")
      .select("*")
      .order("created_at", { ascending: false });

    if (funnelsError) {
      console.error("Error fetching funnels:", funnelsError);
      console.log("📊 Falling back to mock data");
      return getMockFunnels();
    }

    if (!funnelsData || funnelsData.length === 0) {
      console.log("📊 No funnels found in database, returning mock data");
      return getMockFunnels();
    }

    // Fetch steps for all funnels
    const funnelIds = funnelsData.map((f) => f.id);
    const { data: stepsData, error: stepsError } = await supabase
      .from("funnel_steps")
      .select("*")
      .in("funnel_id", funnelIds)
      .order("step_order", { ascending: true });

    if (stepsError) {
      console.error("Error fetching funnel steps:", stepsError);
      console.log("📊 Falling back to mock data");
      return getMockFunnels();
    }

    // Group steps by funnel_id
    const stepsByFunnelId = new Map<string, FunnelStepDB[]>();
    stepsData?.forEach((step) => {
      if (!stepsByFunnelId.has(step.funnel_id)) {
        stepsByFunnelId.set(step.funnel_id, []);
      }
      stepsByFunnelId.get(step.funnel_id)!.push(step);
    });

    // Combine funnels with their steps
    const funnels: ConversionFunnel[] = funnelsData.map((funnel) => ({
      id: funnel.id,
      name: funnel.name,
      conversionRate: Number(funnel.conversion_rate),
      steps: (stepsByFunnelId.get(funnel.id) || []).map((step) => ({
        name: step.name,
        visitors: step.visitors,
        dropoff: Number(step.dropoff),
        url: step.url || undefined,
      })),
    }));

    return funnels;
  } catch (error) {
    console.error("Unexpected error fetching funnels:", error);
    return getMockFunnels();
  }
}

// ============================================
// FETCH SINGLE FUNNEL
// ============================================

export async function fetchFunnel(funnelId: string): Promise<ConversionFunnel | null> {
  // Use mock data if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.log("📊 Using mock funnel data (Supabase not configured)");
    const mockFunnels = getMockFunnels();
    return mockFunnels.find((f) => f.id === funnelId) || null;
  }

  try {
    // Fetch funnel
    const { data: funnelData, error: funnelError } = await supabase
      .from("funnels")
      .select("*")
      .eq("id", funnelId)
      .single();

    if (funnelError || !funnelData) {
      console.error("Error fetching funnel:", funnelError);
      return null;
    }

    // Fetch steps
    const { data: stepsData, error: stepsError } = await supabase
      .from("funnel_steps")
      .select("*")
      .eq("funnel_id", funnelId)
      .order("step_order", { ascending: true });

    if (stepsError) {
      console.error("Error fetching funnel steps:", stepsError);
      return null;
    }

    return {
      id: funnelData.id,
      name: funnelData.name,
      conversionRate: Number(funnelData.conversion_rate),
      steps: (stepsData || []).map((step) => ({
        name: step.name,
        visitors: step.visitors,
        dropoff: Number(step.dropoff),
        url: step.url || undefined,
      })),
    };
  } catch (error) {
    console.error("Unexpected error fetching funnel:", error);
    return null;
  }
}

// ============================================
// CREATE FUNNEL
// ============================================

export async function createFunnel(funnel: {
  name: string;
  steps: FunnelStep[];
}): Promise<ConversionFunnel | null> {
  // Cannot create if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Cannot create funnel: Supabase not configured");
    alert("⚠️ Supabase non configurato! Il funnel non verrà salvato permanentemente.");
    return null;
  }

  try {
    const funnelId = `funnel_${Date.now()}`;

    // Calculate conversion rate (last step visitors / first step visitors)
    const conversionRate = funnel.steps.length > 1
      ? (funnel.steps[funnel.steps.length - 1].visitors / funnel.steps[0].visitors) * 100
      : 0;

    // Insert funnel
    const { data: funnelData, error: funnelError } = await supabase
      .from("funnels")
      .insert({
        id: funnelId,
        name: funnel.name,
        conversion_rate: conversionRate,
      })
      .select()
      .single();

    if (funnelError || !funnelData) {
      console.error("Error creating funnel:", funnelError);
      alert("❌ Errore durante la creazione del funnel");
      return null;
    }

    // Insert steps
    const stepsToInsert = funnel.steps.map((step, index) => ({
      id: `${funnelId}_step_${index + 1}`,
      funnel_id: funnelId,
      name: step.name,
      url: step.url || null,
      visitors: step.visitors,
      dropoff: step.dropoff,
      step_order: index + 1,
    }));

    const { error: stepsError } = await supabase
      .from("funnel_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      console.error("Error creating funnel steps:", stepsError);
      // Rollback: delete the funnel
      await supabase.from("funnels").delete().eq("id", funnelId);
      alert("❌ Errore durante la creazione degli step");
      return null;
    }

    return {
      id: funnelId,
      name: funnel.name,
      conversionRate: conversionRate,
      steps: funnel.steps,
    };
  } catch (error) {
    console.error("Unexpected error creating funnel:", error);
    alert("❌ Errore imprevisto durante la creazione del funnel");
    return null;
  }
}

// ============================================
// UPDATE FUNNEL
// ============================================

export async function updateFunnel(
  funnelId: string,
  funnel: {
    name: string;
    steps: FunnelStep[];
  }
): Promise<boolean> {
  // Cannot update if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Cannot update funnel: Supabase not configured");
    alert("⚠️ Supabase non configurato! Le modifiche non verranno salvate permanentemente.");
    return false;
  }

  try {
    // Calculate conversion rate
    const conversionRate = funnel.steps.length > 1
      ? (funnel.steps[funnel.steps.length - 1].visitors / funnel.steps[0].visitors) * 100
      : 0;

    // Update funnel
    const { error: funnelError } = await supabase
      .from("funnels")
      .update({
        name: funnel.name,
        conversion_rate: conversionRate,
      })
      .eq("id", funnelId);

    if (funnelError) {
      console.error("Error updating funnel:", funnelError);
      alert("❌ Errore durante l'aggiornamento del funnel");
      return false;
    }

    // Delete existing steps
    const { error: deleteError } = await supabase
      .from("funnel_steps")
      .delete()
      .eq("funnel_id", funnelId);

    if (deleteError) {
      console.error("Error deleting old steps:", deleteError);
      alert("❌ Errore durante l'eliminazione dei vecchi step");
      return false;
    }

    // Insert new steps
    const stepsToInsert = funnel.steps.map((step, index) => ({
      id: `${funnelId}_step_${index + 1}_${Date.now()}`,
      funnel_id: funnelId,
      name: step.name,
      url: step.url || null,
      visitors: step.visitors,
      dropoff: step.dropoff,
      step_order: index + 1,
    }));

    const { error: stepsError } = await supabase
      .from("funnel_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      console.error("Error creating new steps:", stepsError);
      alert("❌ Errore durante la creazione dei nuovi step");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error updating funnel:", error);
    alert("❌ Errore imprevisto durante l'aggiornamento del funnel");
    return false;
  }
}

// ============================================
// DELETE FUNNEL
// ============================================

export async function deleteFunnel(funnelId: string): Promise<boolean> {
  // Cannot delete if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Cannot delete funnel: Supabase not configured");
    alert("⚠️ Supabase non configurato!");
    return false;
  }

  try {
    // Delete funnel (cascade will delete steps automatically)
    const { error } = await supabase
      .from("funnels")
      .delete()
      .eq("id", funnelId);

    if (error) {
      console.error("Error deleting funnel:", error);
      alert("❌ Errore durante l'eliminazione del funnel");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error deleting funnel:", error);
    alert("❌ Errore imprevisto durante l'eliminazione del funnel");
    return false;
  }
}
