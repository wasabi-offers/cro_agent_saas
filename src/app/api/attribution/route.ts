import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get users data
    const { data: users, error: usersError } = await supabase
      .from('tracking_users')
      .select('*')
      .gte('first_seen_at', startDate.toISOString())
      .order('last_seen_at', { ascending: false });

    if (usersError) {
      console.error('Users error:', usersError);
    }

    // Get conversions
    const { data: conversions, error: conversionsError } = await supabase
      .from('attribution_conversions')
      .select('*')
      .gte('converted_at', startDate.toISOString())
      .order('converted_at', { ascending: false });

    if (conversionsError) {
      console.error('Conversions error:', conversionsError);
    }

    // Get touchpoints count
    const { count: touchpointsCount } = await supabase
      .from('attribution_touchpoints')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Calculate metrics
    const totalUsers = users?.length || 0;
    const newUsers = users?.filter(u => u.total_sessions === 1).length || 0;
    const returningUsers = users?.filter(u => u.total_sessions > 1).length || 0;
    const totalSessions = users?.reduce((sum, u) => sum + (u.total_sessions || 0), 0) || 0;
    const totalConversions = conversions?.length || 0;
    const totalRevenue = conversions?.reduce((sum, c) => sum + (parseFloat(c.conversion_value) || 0), 0) || 0;
    const conversionRate = totalUsers > 0 ? (totalConversions / totalUsers * 100).toFixed(2) : '0';

    // Channel attribution
    const channelMap = new Map();
    users?.forEach(user => {
      const channel = user.first_touch_source || 'direct';
      const medium = user.first_touch_medium || 'none';
      const key = `${channel}/${medium}`;
      
      if (!channelMap.has(key)) {
        channelMap.set(key, {
          channel,
          medium,
          users: 0,
          sessions: 0,
          conversions: 0,
          revenue: 0
        });
      }
      
      const data = channelMap.get(key);
      data.users++;
      data.sessions += user.total_sessions || 0;
      data.conversions += user.total_conversions || 0;
      data.revenue += parseFloat(user.total_revenue) || 0;
    });
    
    const channelAttribution = Array.from(channelMap.values())
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);

    // Lifecycle stages
    const lifecycleStages = {
      visitor: users?.filter(u => u.lifecycle_stage === 'visitor').length || 0,
      lead: users?.filter(u => u.lifecycle_stage === 'lead').length || 0,
      customer: users?.filter(u => u.lifecycle_stage === 'customer').length || 0,
      returning_customer: users?.filter(u => u.lifecycle_stage === 'returning_customer').length || 0
    };

    // Device breakdown
    const deviceMap = new Map();
    users?.forEach(user => {
      const device = user.primary_device_type || 'unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const deviceBreakdown = Array.from(deviceMap.entries()).map(([device, count]) => ({ device, count }));

    // Browser breakdown
    const browserMap = new Map();
    users?.forEach(user => {
      const browser = user.primary_browser || 'unknown';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });
    const browserBreakdown = Array.from(browserMap.entries()).map(([browser, count]) => ({ browser, count }));

    // Recent users for table
    const recentUsers = users?.slice(0, 20).map(user => ({
      user_id: user.user_id,
      first_seen_at: user.first_seen_at,
      last_seen_at: user.last_seen_at,
      total_sessions: user.total_sessions,
      total_pageviews: user.total_pageviews,
      total_conversions: user.total_conversions,
      total_revenue: user.total_revenue,
      lifecycle_stage: user.lifecycle_stage,
      first_touch_source: user.first_touch_source,
      first_touch_medium: user.first_touch_medium,
      first_touch_campaign: user.first_touch_campaign,
      last_touch_source: user.last_touch_source,
      last_touch_medium: user.last_touch_medium,
      device: user.primary_device_type,
      browser: user.primary_browser
    })) || [];

    return NextResponse.json({
      success: true,
      period: `${days} days`,
      metrics: {
        totalUsers,
        newUsers,
        returningUsers,
        totalSessions,
        totalConversions,
        totalRevenue,
        conversionRate: parseFloat(conversionRate),
        touchpoints: touchpointsCount || 0,
        avgSessionsPerUser: totalUsers > 0 ? (totalSessions / totalUsers).toFixed(2) : '0'
      },
      channelAttribution,
      lifecycleStages,
      deviceBreakdown,
      browserBreakdown,
      recentUsers,
      conversions: conversions?.slice(0, 10) || []
    });
  } catch (error: any) {
    console.error('Attribution API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
