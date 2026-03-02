import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const status = searchParams.get('status') || 'active';

    const supabase = getSupabase();

    if (id || slug) {
      const query = supabase
        .from('quiz_funnels')
        .select('*');

      if (id) query.eq('id', id);
      if (slug) query.eq('slug', slug);

      const { data: funnel, error } = await query.single();
      if (error) throw error;

      const { data: steps } = await supabase
        .from('quiz_funnel_steps')
        .select('*')
        .eq('funnel_id', funnel.id)
        .order('step_order');

      const { data: recentSessions } = await supabase
        .from('quiz_sessions')
        .select('status, dropoff_step, total_time_seconds, completion_percentage, source, device_type')
        .eq('funnel_id', funnel.id)
        .order('started_at', { ascending: false })
        .limit(100);

      const totalSessions = recentSessions?.length || 0;
      const completed = recentSessions?.filter(s => s.status === 'completed').length || 0;
      const abandoned = recentSessions?.filter(s => s.status === 'abandoned').length || 0;
      const inProgress = recentSessions?.filter(s => s.status === 'in_progress').length || 0;

      return NextResponse.json({
        success: true,
        funnel: {
          ...funnel,
          steps: steps || [],
          recentStats: {
            totalSessions,
            completed,
            abandoned,
            inProgress,
            completionRate: totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0,
            avgCompletionTime: completed > 0
              ? Math.round(
                  recentSessions!
                    .filter(s => s.status === 'completed')
                    .reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) / completed
                )
              : 0,
          },
        },
      });
    }

    const { data: funnels, error } = await supabase
      .from('quiz_funnels')
      .select('id, name, slug, description, status, total_starts, total_completions, total_unique_users, tags, created_at, updated_at')
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const funnelsWithRate = (funnels || []).map(f => ({
      ...f,
      completionRate: f.total_starts > 0
        ? Math.round((f.total_completions / f.total_starts) * 100)
        : 0,
    }));

    return NextResponse.json({ success: true, funnels: funnelsWithRate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, base_url, url_pattern, steps, settings, tags } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'name and slug are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: funnel, error: funnelErr } = await supabase
      .from('quiz_funnels')
      .insert({
        name,
        slug,
        description: description || null,
        base_url: base_url || null,
        url_pattern: url_pattern || null,
        settings: settings || undefined,
        tags: tags || [],
      })
      .select()
      .single();

    if (funnelErr) throw funnelErr;

    if (steps && Array.isArray(steps) && steps.length > 0) {
      const stepsData = steps.map((s: any, i: number) => ({
        funnel_id: funnel.id,
        step_order: s.step_order ?? i + 1,
        step_name: s.step_name || `Step ${i + 1}`,
        step_type: s.step_type || 'question',
        question_text: s.question_text || null,
        answers: s.answers || [],
        is_required: s.is_required !== false,
        is_branching: s.is_branching || false,
        branching_rules: s.branching_rules || [],
        metadata: s.metadata || {},
      }));

      const { error: stepsErr } = await supabase
        .from('quiz_funnel_steps')
        .insert(stepsData);

      if (stepsErr) throw stepsErr;
    }

    return NextResponse.json({ success: true, funnel });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const allowedFields = ['name', 'slug', 'description', 'base_url', 'url_pattern', 'status', 'settings', 'tags'];
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (updates[key] !== undefined) updateData[key] = updates[key];
    }

    const { data: funnel, error } = await supabase
      .from('quiz_funnels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (updates.steps && Array.isArray(updates.steps)) {
      await supabase
        .from('quiz_funnel_steps')
        .delete()
        .eq('funnel_id', id);

      const stepsData = updates.steps.map((s: any, i: number) => ({
        funnel_id: id,
        step_order: s.step_order ?? i + 1,
        step_name: s.step_name || `Step ${i + 1}`,
        step_type: s.step_type || 'question',
        question_text: s.question_text || null,
        answers: s.answers || [],
        is_required: s.is_required !== false,
        is_branching: s.is_branching || false,
        branching_rules: s.branching_rules || [],
        metadata: s.metadata || {},
      }));

      await supabase
        .from('quiz_funnel_steps')
        .insert(stepsData);
    }

    return NextResponse.json({ success: true, funnel });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('quiz_funnels')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Funnel archived' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
