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
    const model = searchParams.get('model') || 'first_touch'; // first_touch, last_touch, linear
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all users with their attribution
    const { data: users, error } = await supabase
      .from('tracking_users')
      .select('*')
      .gte('first_seen_at', startDate.toISOString());

    if (error) throw error;

    // Get conversions for revenue attribution
    const { data: conversions } = await supabase
      .from('attribution_conversions')
      .select('*')
      .gte('converted_at', startDate.toISOString());

    // Aggregate by channel based on attribution model
    const channelMap = new Map();

    users?.forEach(user => {
      let source, medium, campaign;
      
      if (model === 'first_touch') {
        source = user.first_touch_source || 'direct';
        medium = user.first_touch_medium || 'none';
        campaign = user.first_touch_campaign || null;
      } else if (model === 'last_touch') {
        source = user.last_touch_source || 'direct';
        medium = user.last_touch_medium || 'none';
        campaign = user.last_touch_campaign || null;
      } else {
        source = user.first_touch_source || 'direct';
        medium = user.first_touch_medium || 'none';
        campaign = user.first_touch_campaign || null;
      }

      const key = `${source}|${medium}|${campaign || 'none'}`;
      
      if (!channelMap.has(key)) {
        channelMap.set(key, {
          source,
          medium,
          campaign,
          users: 0,
          newUsers: 0,
          sessions: 0,
          pageviews: 0,
          conversions: 0,
          revenue: 0,
          customers: 0
        });
      }
      
      const data = channelMap.get(key);
      data.users++;
      if (user.total_sessions === 1) data.newUsers++;
      data.sessions += user.total_sessions || 0;
      data.pageviews += user.total_pageviews || 0;
      data.conversions += user.total_conversions || 0;
      data.revenue += parseFloat(user.total_revenue) || 0;
      if (user.lifecycle_stage === 'customer' || user.lifecycle_stage === 'returning_customer') {
        data.customers++;
      }
    });

    // Calculate metrics
    const channels = Array.from(channelMap.values()).map(channel => ({
      ...channel,
      conversionRate: channel.users > 0 ? ((channel.conversions / channel.users) * 100).toFixed(2) : '0',
      avgOrderValue: channel.conversions > 0 ? (channel.revenue / channel.conversions).toFixed(2) : '0',
      revenuePerUser: channel.users > 0 ? (channel.revenue / channel.users).toFixed(2) : '0',
      avgSessionsPerUser: channel.users > 0 ? (channel.sessions / channel.users).toFixed(2) : '0'
    })).sort((a, b) => b.revenue - a.revenue);

    // Calculate totals
    const totals = {
      users: users?.length || 0,
      sessions: users?.reduce((sum, u) => sum + (u.total_sessions || 0), 0) || 0,
      conversions: users?.reduce((sum, u) => sum + (u.total_conversions || 0), 0) || 0,
      revenue: users?.reduce((sum, u) => sum + (parseFloat(u.total_revenue) || 0), 0) || 0
    };

    // Channel performance comparison
    const performanceComparison = channels.map(channel => ({
      name: `${channel.source}/${channel.medium}`,
      usersShare: totals.users > 0 ? ((channel.users / totals.users) * 100).toFixed(1) : '0',
      revenueShare: totals.revenue > 0 ? ((channel.revenue / totals.revenue) * 100).toFixed(1) : '0',
      efficiencyIndex: totals.users > 0 && totals.revenue > 0 
        ? (((channel.revenue / totals.revenue) / (channel.users / totals.users)) * 100).toFixed(0)
        : '0'
    }));

    return NextResponse.json({
      success: true,
      model,
      period: `${days} days`,
      channels,
      totals,
      performanceComparison,
      topChannels: {
        byUsers: channels.slice(0, 5).map(c => ({ name: `${c.source}/${c.medium}`, value: c.users })),
        byRevenue: [...channels].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(c => ({ name: `${c.source}/${c.medium}`, value: c.revenue })),
        byConversions: [...channels].sort((a, b) => b.conversions - a.conversions).slice(0, 5).map(c => ({ name: `${c.source}/${c.medium}`, value: c.conversions }))
      }
    });
  } catch (error: any) {
    console.error('Channels API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
