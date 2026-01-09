import { supabase } from "./supabase";

// ============================================
// TYPES
// ============================================

export interface ClarityInsight {
  id: string;
  project_id: string;
  fetched_at: string;
  num_days: number;
  dimension: string;
  dimension_value: string;
  metric_name: string;
  total_session_count: number | null;
  total_bot_session_count: number | null;
  distinct_user_count: number | null;
  pages_per_session: number | null;
  average_scroll_depth: number | null;
  total_time: number | null;
  active_time: number | null;
  sessions_count: number | null;
  sessions_with_metric_percentage: number | null;
  sessions_without_metric_percentage: number | null;
  pages_views: number | null;
  sub_total: number | null;
  created_at: string;
}

export interface ClarityTrafficByDevice {
  project_id: string;
  device: string;
  total_session_count: number;
  distinct_user_count: number;
  pages_per_session: number;
  total_bot_session_count: number;
  fetched_at: string;
}

export interface ClarityEngagementByDevice {
  project_id: string;
  device: string;
  total_time: number;
  active_time: number;
  fetched_at: string;
}

export interface ClarityUXIssue {
  project_id: string;
  device: string;
  metric_name: string;
  sessions_count: number;
  sessions_with_metric_percentage: number;
  sub_total: number;
  fetched_at: string;
}

export interface ClarityDailySummary {
  project_id: string;
  date: string;
  dimension: string;
  metric_name: string;
  total_sessions: number | null;
  total_users: number | null;
  avg_scroll_depth: number | null;
  avg_total_time: number | null;
  avg_active_time: number | null;
  total_ux_issues: number | null;
}

export interface CRODashboardData {
  trafficByDevice: ClarityTrafficByDevice[];
  engagementByDevice: ClarityEngagementByDevice[];
  uxIssues: ClarityUXIssue[];
  dailySummary: ClarityDailySummary[];
  insights: ClarityInsight[];
  summary: {
    totalSessions: number;
    totalUsers: number;
    avgPagesPerSession: number;
    avgScrollDepth: number;
    avgTotalTime: number;
    avgActiveTime: number;
    totalDeadClicks: number;
    totalRageClicks: number;
    totalQuickbacks: number;
    botSessions: number;
    mobilePercentage: number;
    desktopPercentage: number;
  };
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

// Fetch all data from the main clarity_insights table and aggregate
export async function fetchClarityInsights(limit: number = 500): Promise<ClarityInsight[]> {
  const { data, error } = await supabase
    .from("clarity_insights")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching insights:", error);
    return [];
  }

  return data || [];
}

// ============================================
// DERIVATION FUNCTIONS (sync, from pre-fetched insights)
// ============================================

function deriveTrafficByDevice(insights: ClarityInsight[]): ClarityTrafficByDevice[] {
  const deviceMap = new Map<string, ClarityTrafficByDevice>();
  
  insights.forEach((insight) => {
    if (insight.dimension === "Device" && insight.dimension_value) {
      const existing = deviceMap.get(insight.dimension_value);
      if (!existing) {
        deviceMap.set(insight.dimension_value, {
          project_id: insight.project_id,
          device: insight.dimension_value,
          total_session_count: insight.total_session_count || 0,
          distinct_user_count: insight.distinct_user_count || 0,
          pages_per_session: insight.pages_per_session || 0,
          total_bot_session_count: insight.total_bot_session_count || 0,
          fetched_at: insight.fetched_at,
        });
      } else if (insight.total_session_count && insight.total_session_count > existing.total_session_count) {
        deviceMap.set(insight.dimension_value, {
          ...existing,
          total_session_count: insight.total_session_count,
          distinct_user_count: insight.distinct_user_count || existing.distinct_user_count,
          pages_per_session: insight.pages_per_session || existing.pages_per_session,
          total_bot_session_count: insight.total_bot_session_count || existing.total_bot_session_count,
        });
      }
    }
  });

  return Array.from(deviceMap.values()).sort((a, b) => b.total_session_count - a.total_session_count);
}

function deriveEngagementByDevice(insights: ClarityInsight[]): ClarityEngagementByDevice[] {
  const deviceMap = new Map<string, ClarityEngagementByDevice>();
  
  insights.forEach((insight) => {
    if (insight.dimension === "Device" && insight.dimension_value && insight.total_time) {
      const existing = deviceMap.get(insight.dimension_value);
      if (!existing || insight.total_time > (existing.total_time || 0)) {
        deviceMap.set(insight.dimension_value, {
          project_id: insight.project_id,
          device: insight.dimension_value,
          total_time: insight.total_time || 0,
          active_time: insight.active_time || 0,
          fetched_at: insight.fetched_at,
        });
      }
    }
  });

  return Array.from(deviceMap.values());
}

function deriveUXIssues(insights: ClarityInsight[]): ClarityUXIssue[] {
  const issues: ClarityUXIssue[] = [];
  const uxMetrics = ["DeadClickCount", "RageClickCount", "QuickbackCount", "ExcessiveScrollCount", "ScriptErrorCount"];
  
  insights.forEach((insight) => {
    if (insight.dimension === "Device" && uxMetrics.includes(insight.metric_name) && insight.sessions_count) {
      issues.push({
        project_id: insight.project_id,
        device: insight.dimension_value,
        metric_name: insight.metric_name,
        sessions_count: insight.sessions_count,
        sessions_with_metric_percentage: insight.sessions_with_metric_percentage || 0,
        sub_total: insight.sub_total || 0,
        fetched_at: insight.fetched_at,
      });
    }
  });

  return issues.sort((a, b) => b.sub_total - a.sub_total);
}

function deriveDailySummary(insights: ClarityInsight[]): ClarityDailySummary[] {
  const summaryMap = new Map<string, ClarityDailySummary>();
  
  insights.forEach((insight) => {
    const date = insight.fetched_at.split("T")[0];
    const key = `${date}-${insight.dimension}-${insight.metric_name}`;
    
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        project_id: insight.project_id,
        date,
        dimension: insight.dimension,
        metric_name: insight.metric_name,
        total_sessions: insight.total_session_count,
        total_users: insight.distinct_user_count,
        avg_scroll_depth: insight.average_scroll_depth,
        avg_total_time: insight.total_time,
        avg_active_time: insight.active_time,
        total_ux_issues: insight.sub_total,
      });
    }
  });

  return Array.from(summaryMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

// ============================================
// AGGREGATED DATA FOR DASHBOARD
// ============================================

export async function fetchCRODashboardData(): Promise<CRODashboardData> {
  // Single fetch - all derived data computed from this one call
  const insights = await fetchClarityInsights(1000);
  
  // Derive all data from the single insights fetch
  const trafficByDevice = deriveTrafficByDevice(insights);
  const engagementByDevice = deriveEngagementByDevice(insights);
  const uxIssues = deriveUXIssues(insights);
  const dailySummary = deriveDailySummary(insights);

  // Calculate summary metrics
  const totalSessions = trafficByDevice.reduce((sum, d) => sum + (d.total_session_count || 0), 0);
  const totalUsers = trafficByDevice.reduce((sum, d) => sum + (d.distinct_user_count || 0), 0);
  const botSessions = trafficByDevice.reduce((sum, d) => sum + (d.total_bot_session_count || 0), 0);

  // Calculate weighted average pages per session
  const avgPagesPerSession = trafficByDevice.length > 0
    ? trafficByDevice.reduce((sum, d) => sum + (d.pages_per_session * d.total_session_count), 0) / totalSessions
    : 0;

  // Calculate engagement metrics
  const avgTotalTime = engagementByDevice.length > 0
    ? engagementByDevice.reduce((sum, d) => sum + d.total_time, 0) / engagementByDevice.length
    : 0;
  const avgActiveTime = engagementByDevice.length > 0
    ? engagementByDevice.reduce((sum, d) => sum + d.active_time, 0) / engagementByDevice.length
    : 0;

  // Calculate UX issues totals
  const deadClickIssues = uxIssues.filter(i => i.metric_name === "DeadClickCount");
  const rageClickIssues = uxIssues.filter(i => i.metric_name === "RageClickCount");
  const quickbackIssues = uxIssues.filter(i => i.metric_name === "QuickbackCount");

  const totalDeadClicks = deadClickIssues.reduce((sum, i) => sum + (i.sub_total || 0), 0);
  const totalRageClicks = rageClickIssues.reduce((sum, i) => sum + (i.sub_total || 0), 0);
  const totalQuickbacks = quickbackIssues.reduce((sum, i) => sum + (i.sub_total || 0), 0);

  // Calculate device percentages
  const mobileData = trafficByDevice.find(d => d.device === "Mobile");
  const desktopData = trafficByDevice.find(d => d.device === "Desktop");
  const mobilePercentage = totalSessions > 0 ? ((mobileData?.total_session_count || 0) / totalSessions) * 100 : 0;
  const desktopPercentage = totalSessions > 0 ? ((desktopData?.total_session_count || 0) / totalSessions) * 100 : 0;

  // Get average scroll depth from insights
  const scrollDepthInsights = insights.filter(i => i.average_scroll_depth !== null);
  const avgScrollDepth = scrollDepthInsights.length > 0
    ? scrollDepthInsights.reduce((sum, i) => sum + (i.average_scroll_depth || 0), 0) / scrollDepthInsights.length
    : 0;

  return {
    trafficByDevice,
    engagementByDevice,
    uxIssues,
    dailySummary,
    insights,
    summary: {
      totalSessions,
      totalUsers,
      avgPagesPerSession,
      avgScrollDepth,
      avgTotalTime,
      avgActiveTime,
      totalDeadClicks,
      totalRageClicks,
      totalQuickbacks,
      botSessions,
      mobilePercentage,
      desktopPercentage,
    },
  };
}

// ============================================
// DATA FOR AI ANALYSIS
// ============================================

export async function getDataForAIAnalysis(): Promise<string> {
  const data = await fetchCRODashboardData();

  // Format data as a structured text for AI analysis
  const analysisContext = `
## CLARITY ANALYTICS DATA

### Traffic Overview
- Total Sessions: ${data.summary.totalSessions.toLocaleString()}
- Total Unique Users: ${data.summary.totalUsers.toLocaleString()}
- Bot Sessions: ${data.summary.botSessions.toLocaleString()} (${((data.summary.botSessions / data.summary.totalSessions) * 100).toFixed(1)}%)
- Pages per Session: ${data.summary.avgPagesPerSession.toFixed(2)}

### Device Breakdown
- Mobile: ${data.summary.mobilePercentage.toFixed(1)}% of traffic
- Desktop: ${data.summary.desktopPercentage.toFixed(1)}% of traffic

### Engagement Metrics
- Average Total Time: ${data.summary.avgTotalTime} seconds
- Average Active Time: ${data.summary.avgActiveTime} seconds
- Average Scroll Depth: ${data.summary.avgScrollDepth.toFixed(1)}%

### UX Issues Detected
- Dead Clicks: ${data.summary.totalDeadClicks.toLocaleString()} total occurrences
- Rage Clicks: ${data.summary.totalRageClicks.toLocaleString()} total occurrences
- Quickbacks: ${data.summary.totalQuickbacks.toLocaleString()} total occurrences

### UX Issues by Device
${data.uxIssues.map(issue => 
  `- ${issue.device} - ${issue.metric_name}: ${issue.sub_total} occurrences (${issue.sessions_with_metric_percentage}% of sessions)`
).join('\n')}

### Traffic by Device Details
${data.trafficByDevice.map(device => 
  `- ${device.device}: ${device.total_session_count.toLocaleString()} sessions, ${device.distinct_user_count.toLocaleString()} users, ${device.pages_per_session.toFixed(2)} pages/session`
).join('\n')}

### Daily Trends (Last entries)
${data.dailySummary.slice(0, 10).map(day => 
  `- ${day.date}: ${day.metric_name} - ${day.total_ux_issues || 'N/A'} issues`
).join('\n')}
`;

  return analysisContext;
}
