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

export interface FunnelConnection {
  source: string;  // Node ID (e.g., "step-1")
  target: string;  // Node ID (e.g., "step-2")
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  connections?: FunnelConnection[];  // Optional for backwards compatibility
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
// FETCH FUNNELS
// ============================================

export async function fetchFunnels(): Promise<ConversionFunnel[]> {
  // Return empty array if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Supabase not configured - cannot fetch funnels");
    return [];
  }

  try {
    // Fetch all funnels
    const { data: funnelsData, error: funnelsError } = await supabase
      .from("funnels")
      .select("*")
      .order("created_at", { ascending: false });

    if (funnelsError) {
      console.error("Error fetching funnels:", funnelsError);
      return [];
    }

    if (!funnelsData || funnelsData.length === 0) {
      console.log("📊 No funnels found in database");
      return [];
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
      return [];
    }

    // Fetch connections for all funnels
    const { data: connectionsData, error: connectionsError } = await supabase
      .from("funnel_connections")
      .select("*")
      .in("funnel_id", funnelIds);

    if (connectionsError) {
      console.error("Error fetching funnel connections:", connectionsError);
      // Continue without connections
    }

    // Group steps by funnel_id
    const stepsByFunnelId = new Map<string, FunnelStepDB[]>();
    stepsData?.forEach((step) => {
      if (!stepsByFunnelId.has(step.funnel_id)) {
        stepsByFunnelId.set(step.funnel_id, []);
      }
      stepsByFunnelId.get(step.funnel_id)!.push(step);
    });

    // Group connections by funnel_id
    const connectionsByFunnelId = new Map<string, FunnelConnectionDB[]>();
    connectionsData?.forEach((conn) => {
      if (!connectionsByFunnelId.has(conn.funnel_id)) {
        connectionsByFunnelId.set(conn.funnel_id, []);
      }
      connectionsByFunnelId.get(conn.funnel_id)!.push(conn);
    });

    // Combine funnels with their steps and connections
    const funnels: ConversionFunnel[] = funnelsData.map((funnel) => {
      const steps = stepsByFunnelId.get(funnel.id) || [];

      // Create a map of database step IDs to node IDs for this funnel
      const dbIdToNodeId = new Map<string, string>();
      steps.forEach((step, index) => {
        const nodeId = `step-${index + 1}`;
        dbIdToNodeId.set(step.id, nodeId);
      });

      // Convert connections from database IDs to node IDs
      const connections: FunnelConnection[] = (connectionsByFunnelId.get(funnel.id) || [])
        .map(conn => ({
          source: dbIdToNodeId.get(conn.source_step_id) || '',
          target: dbIdToNodeId.get(conn.target_step_id) || '',
        }))
        .filter(conn => conn.source && conn.target);

      return {
        id: funnel.id,
        name: funnel.name,
        conversionRate: Number(funnel.conversion_rate),
        steps: steps.map((step) => ({
          name: step.name,
          visitors: step.visitors,
          dropoff: Number(step.dropoff),
          url: step.url || undefined,
        })),
        connections: connections.length > 0 ? connections : undefined,
      };
    });

    return funnels;
  } catch (error) {
    console.error("Unexpected error fetching funnels:", error);
    return [];
  }
}

// ============================================
// FETCH SINGLE FUNNEL
// ============================================

export async function fetchFunnel(funnelId: string): Promise<ConversionFunnel | null> {
  // Return null if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Supabase not configured - cannot fetch funnel");
    return null;
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

    // Fetch connections
    console.log('🔧 FETCH FUNNEL - Fetching connections for funnel:', funnelId);
    const { data: connectionsData, error: connectionsError } = await supabase
      .from("funnel_connections")
      .select("*")
      .eq("funnel_id", funnelId);

    if (connectionsError) {
      console.error("❌ Error fetching funnel connections:", connectionsError);
      // Don't fail, just proceed without connections
    } else {
      console.log('🔧 FETCH FUNNEL - Connections from DB:', connectionsData);
      console.log('🔧 FETCH FUNNEL - Number of connections:', connectionsData?.length || 0);
    }

    // Create a map of database step IDs to node IDs
    const dbIdToNodeId = new Map<string, string>();
    (stepsData || []).forEach((step, index) => {
      const nodeId = `step-${index + 1}`;
      dbIdToNodeId.set(step.id, nodeId);
      console.log(`🔧 FETCH FUNNEL - Mapping DB ID to Node ID: ${step.id} → ${nodeId}`);
    });

    // Convert connections from database IDs to node IDs
    const connections: FunnelConnection[] = (connectionsData || [])
      .map(conn => ({
        source: dbIdToNodeId.get(conn.source_step_id) || '',
        target: dbIdToNodeId.get(conn.target_step_id) || '',
      }))
      .filter(conn => conn.source && conn.target);

    console.log('🔧 FETCH FUNNEL - Converted connections (node IDs):', connections);
    console.log('🔧 FETCH FUNNEL - Number of converted connections:', connections.length);

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
      connections: connections.length > 0 ? connections : undefined,
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
  connections?: FunnelConnection[];
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

    // Insert connections if provided
    console.log('🔧 CREATE FUNNEL - Connections to save:', funnel.connections);
    if (funnel.connections && funnel.connections.length > 0) {
      // Create a map of step node IDs to database IDs
      const stepIdMap = new Map<string, string>();
      funnel.steps.forEach((step, index) => {
        const nodeId = `step-${index + 1}`;  // ReactFlow node ID
        const dbId = `${funnelId}_step_${index + 1}`;  // Database ID
        stepIdMap.set(nodeId, dbId);
      });

      const connectionsToInsert = funnel.connections.map((conn, index) => ({
        id: `${funnelId}_conn_${index + 1}`,
        funnel_id: funnelId,
        source_step_id: stepIdMap.get(conn.source) || '',
        target_step_id: stepIdMap.get(conn.target) || '',
      })).filter(conn => conn.source_step_id && conn.target_step_id);

      console.log('🔧 Connections to insert in DB:', connectionsToInsert);

      if (connectionsToInsert.length > 0) {
        const { error: connectionsError } = await supabase
          .from("funnel_connections")
          .insert(connectionsToInsert);

        if (connectionsError) {
          console.error("❌ Error creating funnel connections:", connectionsError);
          console.warn("⚠️ Funnel created but connections failed to save");
        } else {
          console.log('✅ Connections saved successfully!');
        }
      }
    } else {
      console.log('⚠️ No connections provided, skipping');
    }

    return {
      id: funnelId,
      name: funnel.name,
      conversionRate: conversionRate,
      steps: funnel.steps,
      connections: funnel.connections,
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
    connections?: FunnelConnection[];
  }
): Promise<boolean> {
  // Cannot update if Supabase is not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("❌ Cannot update funnel: Supabase not configured");
    alert("⚠️ Supabase non configurato! Le modifiche non verranno salvate permanentemente.");
    return false;
  }

  try {
    console.log('🔧 UPDATE FUNNEL - Starting update for:', funnelId);
    console.log('🔧 UPDATE FUNNEL - Connections received:', funnel.connections);
    console.log('🔧 UPDATE FUNNEL - Number of connections:', funnel.connections?.length || 0);

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
      console.error("❌ Error updating funnel:", funnelError);
      alert("❌ Errore durante l'aggiornamento del funnel");
      return false;
    }

    console.log('✅ Funnel metadata updated');

    // Delete existing steps
    const { error: deleteError } = await supabase
      .from("funnel_steps")
      .delete()
      .eq("funnel_id", funnelId);

    if (deleteError) {
      console.error("❌ Error deleting old steps:", deleteError);
      alert("❌ Errore durante l'eliminazione dei vecchi step");
      return false;
    }

    console.log('✅ Old steps deleted');

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

    console.log('🔧 Steps to insert:', stepsToInsert.length);

    const { error: stepsError } = await supabase
      .from("funnel_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      console.error("❌ Error creating new steps:", stepsError);
      alert("❌ Errore durante la creazione dei nuovi step");
      return false;
    }

    console.log('✅ New steps inserted');

    // Delete existing connections
    const { error: deleteConnectionsError } = await supabase
      .from("funnel_connections")
      .delete()
      .eq("funnel_id", funnelId);

    if (deleteConnectionsError) {
      console.log('⚠️ Error deleting old connections (might not exist):', deleteConnectionsError);
    } else {
      console.log('✅ Old connections deleted');
    }

    // Insert new connections if provided
    if (funnel.connections && funnel.connections.length > 0) {
      console.log('🔧 Processing connections for update...');

      // Create a map of step node IDs to database IDs
      const stepIdMap = new Map<string, string>();
      funnel.steps.forEach((step, index) => {
        const nodeId = `step-${index + 1}`;
        const dbId = stepsToInsert[index].id;
        stepIdMap.set(nodeId, dbId);
        console.log(`🔧 Mapping: ${nodeId} → ${dbId}`);
      });

      const connectionsToInsert = funnel.connections.map((conn, index) => ({
        id: `${funnelId}_conn_${index + 1}_${Date.now()}`,
        funnel_id: funnelId,
        source_step_id: stepIdMap.get(conn.source) || '',
        target_step_id: stepIdMap.get(conn.target) || '',
      })).filter(conn => conn.source_step_id && conn.target_step_id);

      console.log('🔧 Connections to insert in DB:', connectionsToInsert);
      console.log('🔧 Number of connections to insert:', connectionsToInsert.length);

      if (connectionsToInsert.length > 0) {
        const { error: connectionsError } = await supabase
          .from("funnel_connections")
          .insert(connectionsToInsert);

        if (connectionsError) {
          console.error("❌ Error creating funnel connections:", connectionsError);
          console.warn("⚠️ Funnel updated but connections failed to save");
        } else {
          console.log('✅ Connections saved successfully!');
        }
      } else {
        console.log('⚠️ No valid connections to insert after filtering');
      }
    } else {
      console.log('⚠️ No connections provided in update, skipping');
    }

    console.log('✅ UPDATE FUNNEL - Complete!');
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
