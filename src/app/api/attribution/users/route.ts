import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (userId) {
      // Get specific user with their journey
      const { data: user, error: userError } = await supabase
        .from('tracking_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userError) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // Get user's touchpoints
      const { data: touchpoints, error: touchpointsError } = await supabase
        .from('attribution_touchpoints')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      // Get user's conversions
      const { data: conversions, error: conversionsError } = await supabase
        .from('attribution_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('converted_at', { ascending: false });

      // Get user's sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('first_seen_at', { ascending: false });

      return NextResponse.json({
        success: true,
        user,
        touchpoints: touchpoints || [],
        conversions: conversions || [],
        sessions: sessions || [],
        journey: {
          totalTouchpoints: touchpoints?.length || 0,
          totalConversions: conversions?.length || 0,
          totalSessions: sessions?.length || 0,
          customerLifetimeDays: user.first_seen_at && user.last_seen_at 
            ? Math.floor((new Date(user.last_seen_at).getTime() - new Date(user.first_seen_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0
        }
      });
    }

    // List all users with pagination
    const { data: users, error, count } = await supabase
      .from('tracking_users')
      .select('*', { count: 'exact' })
      .order('last_seen_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
