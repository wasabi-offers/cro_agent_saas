import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// CONFIGURAZIONE
// ============================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================
// DEFINIZIONE TOOLS PER CRO
// ============================================

const tools: Anthropic.Tool[] = [
  {
    name: "get_clarity_overview",
    description: "Ottieni una panoramica generale dei dati Clarity: sessioni totali, utenti, metriche di engagement e problemi UX.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_traffic_by_device",
    description: "Ottieni il traffico suddiviso per dispositivo (Mobile, Desktop, Tablet). Include sessioni, utenti, pagine per sessione e bot.",
    input_schema: {
      type: "object" as const,
      properties: {
        device: {
          type: "string",
          enum: ["Mobile", "Desktop", "Tablet", "PC"],
          description: "Filtra per un dispositivo specifico (opzionale)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_ux_issues",
    description: "Ottieni i problemi UX rilevati: dead clicks, rage clicks, quickbacks, script errors, excessive scroll. Può filtrare per dispositivo o tipo di problema.",
    input_schema: {
      type: "object" as const,
      properties: {
        device: {
          type: "string",
          enum: ["Mobile", "Desktop", "Tablet", "PC"],
          description: "Filtra per dispositivo",
        },
        issue_type: {
          type: "string",
          enum: ["DeadClickCount", "RageClickCount", "QuickbackCount", "ScriptErrorCount", "ExcessiveScrollCount"],
          description: "Filtra per tipo di problema UX",
        },
        limit: {
          type: "number",
          description: "Numero massimo di risultati (default 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_engagement_metrics",
    description: "Ottieni metriche di engagement: tempo totale, tempo attivo, scroll depth, pagine per sessione. Può filtrare per dispositivo.",
    input_schema: {
      type: "object" as const,
      properties: {
        device: {
          type: "string",
          enum: ["Mobile", "Desktop", "Tablet", "PC"],
          description: "Filtra per dispositivo",
        },
      },
      required: [],
    },
  },
  {
    name: "search_insights",
    description: "Cerca negli insights di Clarity con filtri avanzati. Può filtrare per dimensione, valore, metrica, date.",
    input_schema: {
      type: "object" as const,
      properties: {
        dimension: {
          type: "string",
          description: "Dimensione (es: Device, Browser, Country)",
        },
        dimension_value: {
          type: "string",
          description: "Valore della dimensione (es: Mobile, Chrome, Italy)",
        },
        metric_name: {
          type: "string",
          description: "Nome della metrica (es: DeadClickCount, RageClickCount)",
        },
        date_from: {
          type: "string",
          description: "Data inizio (YYYY-MM-DD)",
        },
        date_to: {
          type: "string",
          description: "Data fine (YYYY-MM-DD)",
        },
        limit: {
          type: "number",
          description: "Numero massimo di risultati (default 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_statistics",
    description: "Ottieni statistiche aggregate sui dati CRO.",
    input_schema: {
      type: "object" as const,
      properties: {
        stat_type: {
          type: "string",
          enum: [
            "total_sessions",
            "total_users",
            "sessions_by_device",
            "ux_issues_summary",
            "top_ux_issues",
            "engagement_by_device",
            "bot_traffic",
            "daily_trends",
          ],
          description: "Tipo di statistica da calcolare",
        },
        limit: {
          type: "number",
          description: "Numero di risultati per ranking (default 10)",
        },
      },
      required: ["stat_type"],
    },
  },
  {
    name: "find_cro_patterns",
    description: "Trova pattern e anomalie nei dati CRO per identificare opportunità di ottimizzazione.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern_type: {
          type: "string",
          enum: [
            "device_comparison",
            "ux_issue_trends",
            "engagement_anomalies",
            "conversion_blockers",
            "mobile_vs_desktop",
            "high_impact_issues",
          ],
          description: "Tipo di pattern da cercare",
        },
      },
      required: ["pattern_type"],
    },
  },
  {
    name: "compare_devices",
    description: "Confronta le performance tra diversi dispositivi per identificare gap e opportunità.",
    input_schema: {
      type: "object" as const,
      properties: {
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metriche da confrontare (es: sessions, engagement, ux_issues)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_ab_test_suggestions",
    description: "Genera suggerimenti per A/B test basati sui dati attuali e sui problemi rilevati.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus_area: {
          type: "string",
          enum: ["mobile", "desktop", "ux_issues", "engagement", "conversion"],
          description: "Area su cui concentrare i suggerimenti",
        },
        max_suggestions: {
          type: "number",
          description: "Numero massimo di suggerimenti (default 5)",
        },
      },
      required: [],
    },
  },
];

// ============================================
// ESECUZIONE TOOLS
// ============================================

async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  try {
    switch (toolName) {
      // -----------------------------------------
      // CLARITY OVERVIEW
      // -----------------------------------------
      case "get_clarity_overview": {
        const { data: insights, error } = await supabase
          .from("clarity_insights")
          .select("*")
          .order("fetched_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        // Calculate overview
        const deviceData = new Map<string, { sessions: number; users: number; pagesPerSession: number; bots: number }>();
        const uxIssues = { deadClicks: 0, rageClicks: 0, quickbacks: 0, scriptErrors: 0 };
        let totalTime = 0;
        let activeTime = 0;
        let timeCount = 0;

        insights?.forEach((insight) => {
          if (insight.dimension === "Device" && insight.dimension_value) {
            const device = insight.dimension_value;
            
            if (insight.total_session_count) {
              deviceData.set(device, {
                sessions: insight.total_session_count,
                users: insight.distinct_user_count || 0,
                pagesPerSession: insight.pages_per_session || 0,
                bots: insight.total_bot_session_count || 0,
              });
            }

            if (insight.total_time) {
              totalTime += insight.total_time;
              activeTime += insight.active_time || 0;
              timeCount++;
            }

            // UX Issues
            if (insight.metric_name === "DeadClickCount" && insight.sub_total) {
              uxIssues.deadClicks += insight.sub_total;
            }
            if (insight.metric_name === "RageClickCount" && insight.sub_total) {
              uxIssues.rageClicks += insight.sub_total;
            }
            if (insight.metric_name === "QuickbackCount" && insight.sub_total) {
              uxIssues.quickbacks += insight.sub_total;
            }
            if (insight.metric_name === "ScriptErrorCount" && insight.sub_total) {
              uxIssues.scriptErrors += insight.sub_total;
            }
          }
        });

        const devices = Array.from(deviceData.entries()).map(([device, data]) => ({
          device,
          ...data,
        }));

        const totalSessions = devices.reduce((sum, d) => sum + d.sessions, 0);
        const totalUsers = devices.reduce((sum, d) => sum + d.users, 0);

        return {
          totalSessions,
          totalUsers,
          avgTotalTime: timeCount > 0 ? Math.round(totalTime / timeCount) : 0,
          avgActiveTime: timeCount > 0 ? Math.round(activeTime / timeCount) : 0,
          deviceBreakdown: devices,
          uxIssuesSummary: uxIssues,
          totalUxIssues: uxIssues.deadClicks + uxIssues.rageClicks + uxIssues.quickbacks + uxIssues.scriptErrors,
          dataPoints: insights?.length || 0,
        };
      }

      // -----------------------------------------
      // TRAFFIC BY DEVICE
      // -----------------------------------------
      case "get_traffic_by_device": {
        const { data: insights, error } = await supabase
          .from("clarity_insights")
          .select("*")
          .eq("dimension", "Device")
          .order("fetched_at", { ascending: false })
          .limit(200);

        if (error) throw error;

        const deviceMap = new Map<string, {
          sessions: number;
          users: number;
          pagesPerSession: number;
          bots: number;
          scrollDepth: number;
        }>();

        insights?.forEach((insight) => {
          if (insight.dimension_value && insight.total_session_count) {
            const existing = deviceMap.get(insight.dimension_value);
            if (!existing || insight.total_session_count > existing.sessions) {
              deviceMap.set(insight.dimension_value, {
                sessions: insight.total_session_count,
                users: insight.distinct_user_count || 0,
                pagesPerSession: insight.pages_per_session || 0,
                bots: insight.total_bot_session_count || 0,
                scrollDepth: insight.average_scroll_depth || 0,
              });
            }
          }
        });

        let result = Array.from(deviceMap.entries()).map(([device, data]) => ({
          device,
          ...data,
        }));

        // Filter by device if specified
        if (toolInput.device) {
          result = result.filter(d => d.device === toolInput.device);
        }

        // Calculate percentages
        const totalSessions = result.reduce((sum, d) => sum + d.sessions, 0);
        return result.map(d => ({
          ...d,
          percentage: totalSessions > 0 ? ((d.sessions / totalSessions) * 100).toFixed(1) + "%" : "0%",
        }));
      }

      // -----------------------------------------
      // UX ISSUES
      // -----------------------------------------
      case "get_ux_issues": {
        let query = supabase
          .from("clarity_insights")
          .select("*")
          .eq("dimension", "Device")
          .in("metric_name", ["DeadClickCount", "RageClickCount", "QuickbackCount", "ScriptErrorCount", "ExcessiveScrollCount"])
          .order("sub_total", { ascending: false });

        const { data: issues, error } = await query.limit((toolInput.limit as number) || 50);

        if (error) throw error;

        let result = issues?.filter(i => i.sessions_count && i.sessions_count > 0) || [];

        // Filter by device
        if (toolInput.device) {
          result = result.filter(i => i.dimension_value === toolInput.device);
        }

        // Filter by issue type
        if (toolInput.issue_type) {
          result = result.filter(i => i.metric_name === toolInput.issue_type);
        }

        return result.map(issue => ({
          device: issue.dimension_value,
          issueType: issue.metric_name.replace("Count", ""),
          occurrences: issue.sub_total,
          affectedSessions: issue.sessions_count,
          percentageOfSessions: issue.sessions_with_metric_percentage,
          severity: issue.sessions_with_metric_percentage! > 20 ? "HIGH" : 
                   issue.sessions_with_metric_percentage! > 10 ? "MEDIUM" : "LOW",
        }));
      }

      // -----------------------------------------
      // ENGAGEMENT METRICS
      // -----------------------------------------
      case "get_engagement_metrics": {
        const { data: insights, error } = await supabase
          .from("clarity_insights")
          .select("*")
          .eq("dimension", "Device")
          .not("total_time", "is", null)
          .order("fetched_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        const deviceMap = new Map<string, {
          totalTime: number;
          activeTime: number;
          scrollDepth: number;
          pagesPerSession: number;
        }>();

        insights?.forEach((insight) => {
          if (insight.dimension_value && insight.total_time) {
            const existing = deviceMap.get(insight.dimension_value);
            if (!existing || insight.total_time > existing.totalTime) {
              deviceMap.set(insight.dimension_value, {
                totalTime: insight.total_time,
                activeTime: insight.active_time || 0,
                scrollDepth: insight.average_scroll_depth || 0,
                pagesPerSession: insight.pages_per_session || 0,
              });
            }
          }
        });

        let result = Array.from(deviceMap.entries()).map(([device, data]) => ({
          device,
          totalTimeSeconds: data.totalTime,
          activeTimeSeconds: data.activeTime,
          engagementRate: data.totalTime > 0 ? ((data.activeTime / data.totalTime) * 100).toFixed(1) + "%" : "0%",
          avgScrollDepth: data.scrollDepth.toFixed(1) + "%",
          pagesPerSession: data.pagesPerSession.toFixed(2),
        }));

        if (toolInput.device) {
          result = result.filter(d => d.device === toolInput.device);
        }

        return result;
      }

      // -----------------------------------------
      // SEARCH INSIGHTS
      // -----------------------------------------
      case "search_insights": {
        let query = supabase
          .from("clarity_insights")
          .select("*")
          .order("fetched_at", { ascending: false });

        if (toolInput.dimension) {
          query = query.eq("dimension", toolInput.dimension);
        }
        if (toolInput.dimension_value) {
          query = query.ilike("dimension_value", `%${toolInput.dimension_value}%`);
        }
        if (toolInput.metric_name) {
          query = query.ilike("metric_name", `%${toolInput.metric_name}%`);
        }
        if (toolInput.date_from) {
          query = query.gte("fetched_at", toolInput.date_from);
        }
        if (toolInput.date_to) {
          query = query.lte("fetched_at", toolInput.date_to);
        }

        const limit = Math.min((toolInput.limit as number) || 50, 100);
        const { data, error } = await query.limit(limit);

        if (error) throw error;

        return data?.map(insight => ({
          id: insight.id,
          dimension: insight.dimension,
          dimensionValue: insight.dimension_value,
          metric: insight.metric_name,
          sessions: insight.total_session_count || insight.sessions_count,
          users: insight.distinct_user_count,
          value: insight.sub_total,
          percentage: insight.sessions_with_metric_percentage,
          date: insight.fetched_at?.split("T")[0],
        }));
      }

      // -----------------------------------------
      // STATISTICS
      // -----------------------------------------
      case "get_statistics": {
        const { data: allInsights, error } = await supabase
          .from("clarity_insights")
          .select("*")
          .order("fetched_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        const limit = (toolInput.limit as number) || 10;

        switch (toolInput.stat_type) {
          case "total_sessions": {
            const deviceSessions = new Map<string, number>();
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.total_session_count) {
                const existing = deviceSessions.get(i.dimension_value) || 0;
                if (i.total_session_count > existing) {
                  deviceSessions.set(i.dimension_value, i.total_session_count);
                }
              }
            });
            const total = Array.from(deviceSessions.values()).reduce((sum, v) => sum + v, 0);
            return { totalSessions: total, byDevice: Object.fromEntries(deviceSessions) };
          }

          case "total_users": {
            const deviceUsers = new Map<string, number>();
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.distinct_user_count) {
                const existing = deviceUsers.get(i.dimension_value) || 0;
                if (i.distinct_user_count > existing) {
                  deviceUsers.set(i.dimension_value, i.distinct_user_count);
                }
              }
            });
            const total = Array.from(deviceUsers.values()).reduce((sum, v) => sum + v, 0);
            return { totalUsers: total, byDevice: Object.fromEntries(deviceUsers) };
          }

          case "sessions_by_device": {
            const deviceData = new Map<string, { sessions: number; users: number; percentage: number }>();
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.total_session_count) {
                const existing = deviceData.get(i.dimension_value);
                if (!existing || i.total_session_count > existing.sessions) {
                  deviceData.set(i.dimension_value, {
                    sessions: i.total_session_count,
                    users: i.distinct_user_count || 0,
                    percentage: 0,
                  });
                }
              }
            });
            const total = Array.from(deviceData.values()).reduce((sum, d) => sum + d.sessions, 0);
            return Array.from(deviceData.entries())
              .map(([device, data]) => ({
                device,
                sessions: data.sessions,
                users: data.users,
                percentage: ((data.sessions / total) * 100).toFixed(1) + "%",
              }))
              .sort((a, b) => b.sessions - a.sessions);
          }

          case "ux_issues_summary": {
            const issues: Record<string, number> = {};
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.sub_total) {
                const metric = i.metric_name;
                if (metric.includes("Click") || metric.includes("Quickback") || metric.includes("Error") || metric.includes("Scroll")) {
                  issues[metric] = (issues[metric] || 0) + i.sub_total;
                }
              }
            });
            return Object.entries(issues)
              .sort((a, b) => b[1] - a[1])
              .map(([issue, count]) => ({ issue, count }));
          }

          case "top_ux_issues": {
            const issuesByDevice: Array<{ device: string; issue: string; count: number; percentage: number }> = [];
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.sub_total && i.sessions_with_metric_percentage) {
                const metric = i.metric_name;
                if (metric.includes("Click") || metric.includes("Quickback") || metric.includes("Error")) {
                  issuesByDevice.push({
                    device: i.dimension_value,
                    issue: metric.replace("Count", ""),
                    count: i.sub_total,
                    percentage: i.sessions_with_metric_percentage,
                  });
                }
              }
            });
            return issuesByDevice.sort((a, b) => b.count - a.count).slice(0, limit);
          }

          case "engagement_by_device": {
            const engagement = new Map<string, { totalTime: number; activeTime: number }>();
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.total_time) {
                const existing = engagement.get(i.dimension_value);
                if (!existing || i.total_time > existing.totalTime) {
                  engagement.set(i.dimension_value, {
                    totalTime: i.total_time,
                    activeTime: i.active_time || 0,
                  });
                }
              }
            });
            return Array.from(engagement.entries()).map(([device, data]) => ({
              device,
              totalTimeSeconds: data.totalTime,
              activeTimeSeconds: data.activeTime,
              engagementRate: ((data.activeTime / data.totalTime) * 100).toFixed(1) + "%",
            }));
          }

          case "bot_traffic": {
            const bots = new Map<string, number>();
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.total_bot_session_count) {
                const existing = bots.get(i.dimension_value) || 0;
                if (i.total_bot_session_count > existing) {
                  bots.set(i.dimension_value, i.total_bot_session_count);
                }
              }
            });
            return Object.fromEntries(bots);
          }

          case "daily_trends": {
            const daily = new Map<string, { sessions: number; issues: number }>();
            allInsights?.forEach(i => {
              const date = i.fetched_at?.split("T")[0];
              if (date) {
                const existing = daily.get(date) || { sessions: 0, issues: 0 };
                if (i.total_session_count) {
                  existing.sessions = Math.max(existing.sessions, i.total_session_count);
                }
                if (i.sub_total) {
                  existing.issues += i.sub_total;
                }
                daily.set(date, existing);
              }
            });
            return Array.from(daily.entries())
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, limit)
              .map(([date, data]) => ({ date, ...data }));
          }

          default:
            return { error: "Unknown stat_type" };
        }
      }

      // -----------------------------------------
      // FIND CRO PATTERNS
      // -----------------------------------------
      case "find_cro_patterns": {
        const { data: allInsights, error } = await supabase
          .from("clarity_insights")
          .select("*")
          .order("fetched_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        switch (toolInput.pattern_type) {
          case "device_comparison": {
            const devices = new Map<string, {
              sessions: number;
              users: number;
              pagesPerSession: number;
              totalTime: number;
              activeTime: number;
              deadClicks: number;
              rageClicks: number;
            }>();

            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.dimension_value) {
                const existing = devices.get(i.dimension_value) || {
                  sessions: 0, users: 0, pagesPerSession: 0, totalTime: 0, activeTime: 0, deadClicks: 0, rageClicks: 0
                };

                if (i.total_session_count && i.total_session_count > existing.sessions) {
                  existing.sessions = i.total_session_count;
                  existing.users = i.distinct_user_count || 0;
                  existing.pagesPerSession = i.pages_per_session || 0;
                }
                if (i.total_time && i.total_time > existing.totalTime) {
                  existing.totalTime = i.total_time;
                  existing.activeTime = i.active_time || 0;
                }
                if (i.metric_name === "DeadClickCount" && i.sub_total) {
                  existing.deadClicks += i.sub_total;
                }
                if (i.metric_name === "RageClickCount" && i.sub_total) {
                  existing.rageClicks += i.sub_total;
                }

                devices.set(i.dimension_value, existing);
              }
            });

            return Array.from(devices.entries()).map(([device, data]) => ({
              device,
              ...data,
              engagementRate: data.totalTime > 0 ? ((data.activeTime / data.totalTime) * 100).toFixed(1) + "%" : "N/A",
            }));
          }

          case "mobile_vs_desktop": {
            const mobile = { sessions: 0, users: 0, deadClicks: 0, rageClicks: 0, totalTime: 0, activeTime: 0 };
            const desktop = { sessions: 0, users: 0, deadClicks: 0, rageClicks: 0, totalTime: 0, activeTime: 0 };

            allInsights?.forEach(i => {
              if (i.dimension === "Device") {
                const target = i.dimension_value === "Mobile" ? mobile : 
                              i.dimension_value === "Desktop" || i.dimension_value === "PC" ? desktop : null;
                
                if (target) {
                  if (i.total_session_count && i.total_session_count > target.sessions) {
                    target.sessions = i.total_session_count;
                    target.users = i.distinct_user_count || 0;
                  }
                  if (i.total_time && i.total_time > target.totalTime) {
                    target.totalTime = i.total_time;
                    target.activeTime = i.active_time || 0;
                  }
                  if (i.metric_name === "DeadClickCount" && i.sub_total) {
                    target.deadClicks += i.sub_total;
                  }
                  if (i.metric_name === "RageClickCount" && i.sub_total) {
                    target.rageClicks += i.sub_total;
                  }
                }
              }
            });

            const totalSessions = mobile.sessions + desktop.sessions;

            return {
              mobile: {
                ...mobile,
                trafficShare: ((mobile.sessions / totalSessions) * 100).toFixed(1) + "%",
                engagementRate: mobile.totalTime > 0 ? ((mobile.activeTime / mobile.totalTime) * 100).toFixed(1) + "%" : "N/A",
              },
              desktop: {
                ...desktop,
                trafficShare: ((desktop.sessions / totalSessions) * 100).toFixed(1) + "%",
                engagementRate: desktop.totalTime > 0 ? ((desktop.activeTime / desktop.totalTime) * 100).toFixed(1) + "%" : "N/A",
              },
              insights: [
                mobile.sessions > desktop.sessions ? "Mobile dominates traffic" : "Desktop dominates traffic",
                mobile.deadClicks > desktop.deadClicks ? "Mobile has more dead clicks - UX needs optimization" : "Desktop has more dead clicks",
                mobile.rageClicks > desktop.rageClicks ? "Mobile has more rage clicks - user frustration" : "Desktop has more rage clicks",
              ],
            };
          }

          case "high_impact_issues": {
            const issues: Array<{
              device: string;
              issue: string;
              occurrences: number;
              affectedPercentage: number;
              impact: string;
            }> = [];

            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.sub_total && i.sessions_with_metric_percentage) {
                if (i.sessions_with_metric_percentage > 15) {
                  issues.push({
                    device: i.dimension_value,
                    issue: i.metric_name.replace("Count", ""),
                    occurrences: i.sub_total,
                    affectedPercentage: i.sessions_with_metric_percentage,
                    impact: i.sessions_with_metric_percentage > 25 ? "CRITICAL" : "HIGH",
                  });
                }
              }
            });

            return issues.sort((a, b) => b.affectedPercentage - a.affectedPercentage);
          }

          case "conversion_blockers": {
            const blockers: Array<{ issue: string; device: string; impact: string; recommendation: string }> = [];
            
            allInsights?.forEach(i => {
              if (i.dimension === "Device" && i.sessions_with_metric_percentage && i.sessions_with_metric_percentage > 20) {
                let recommendation = "";
                
                if (i.metric_name === "DeadClickCount") {
                  recommendation = "Check elements that look clickable but aren't. Add hover states and pointer cursors.";
                } else if (i.metric_name === "RageClickCount") {
                  recommendation = "Users are frustrated. Check loading times and responsiveness of interactive elements.";
                } else if (i.metric_name === "QuickbackCount") {
                  recommendation = "Users are quickly bouncing back. Page content doesn't meet expectations.";
                } else if (i.metric_name === "ScriptErrorCount") {
                  recommendation = "Critical JavaScript errors. Check console errors and fix bugs.";
                }

                if (recommendation) {
                  blockers.push({
                    issue: i.metric_name.replace("Count", ""),
                    device: i.dimension_value,
                    impact: `${i.sessions_with_metric_percentage}% delle sessioni colpite`,
                    recommendation,
                  });
                }
              }
            });

            return blockers.sort((a, b) => 
              parseFloat(b.impact) - parseFloat(a.impact)
            );
          }

          default:
            return { error: "Unknown pattern_type" };
        }
      }

      // -----------------------------------------
      // COMPARE DEVICES
      // -----------------------------------------
      case "compare_devices": {
        const { data: allInsights, error } = await supabase
          .from("clarity_insights")
          .select("*")
          .eq("dimension", "Device")
          .order("fetched_at", { ascending: false })
          .limit(300);

        if (error) throw error;

        const devices = new Map<string, Record<string, number | string>>();

        allInsights?.forEach(i => {
          if (i.dimension_value) {
            const existing = devices.get(i.dimension_value) || { device: i.dimension_value };

            if (i.total_session_count && (!existing.sessions || i.total_session_count > (existing.sessions as number))) {
              existing.sessions = i.total_session_count;
              existing.users = i.distinct_user_count || 0;
              existing.pagesPerSession = i.pages_per_session || 0;
              existing.bots = i.total_bot_session_count || 0;
            }

            if (i.total_time && (!existing.totalTime || i.total_time > (existing.totalTime as number))) {
              existing.totalTime = i.total_time;
              existing.activeTime = i.active_time || 0;
            }

            if (i.metric_name === "DeadClickCount" && i.sub_total) {
              existing.deadClicks = (existing.deadClicks as number || 0) + i.sub_total;
            }
            if (i.metric_name === "RageClickCount" && i.sub_total) {
              existing.rageClicks = (existing.rageClicks as number || 0) + i.sub_total;
            }
            if (i.metric_name === "QuickbackCount" && i.sub_total) {
              existing.quickbacks = (existing.quickbacks as number || 0) + i.sub_total;
            }

            devices.set(i.dimension_value, existing);
          }
        });

        return Array.from(devices.values()).map(d => ({
          ...d,
          engagementRate: d.totalTime ? (((d.activeTime as number) / (d.totalTime as number)) * 100).toFixed(1) + "%" : "N/A",
        }));
      }

      // -----------------------------------------
      // A/B TEST SUGGESTIONS
      // -----------------------------------------
      case "get_ab_test_suggestions": {
        const { data: allInsights, error } = await supabase
          .from("clarity_insights")
          .select("*")
          .order("fetched_at", { ascending: false })
          .limit(300);

        if (error) throw error;

        const suggestions: Array<{
          name: string;
          hypothesis: string;
          priority: string;
          expectedImpact: string;
          targetDevice: string;
          basedOn: string;
        }> = [];

        // Analyze data to generate suggestions
        const mobileIssues: Record<string, number> = {};
        const desktopIssues: Record<string, number> = {};

        allInsights?.forEach(i => {
          if (i.dimension === "Device" && i.sub_total) {
            if (i.dimension_value === "Mobile") {
              mobileIssues[i.metric_name] = (mobileIssues[i.metric_name] || 0) + i.sub_total;
            } else if (i.dimension_value === "Desktop" || i.dimension_value === "PC") {
              desktopIssues[i.metric_name] = (desktopIssues[i.metric_name] || 0) + i.sub_total;
            }
          }
        });

        // Generate suggestions based on issues
        if (mobileIssues["DeadClickCount"] > 500) {
          suggestions.push({
            name: "Mobile Touch Targets Optimization",
            hypothesis: "By increasing touch target sizes and adding visual feedback, we will reduce dead clicks by 30%",
            priority: "HIGH",
            expectedImpact: "+15-20% mobile conversions",
            targetDevice: "Mobile",
            basedOn: `${mobileIssues["DeadClickCount"]} dead clicks detected on mobile`,
          });
        }

        if (mobileIssues["RageClickCount"] > 200) {
          suggestions.push({
            name: "Mobile Loading Speed Optimization",
            hypothesis: "By optimizing interactive element response times, we will reduce rage clicks and user frustration",
            priority: "HIGH",
            expectedImpact: "+10-15% conversions, -25% bounce rate",
            targetDevice: "Mobile",
            basedOn: `${mobileIssues["RageClickCount"]} rage clicks detected`,
          });
        }

        if (mobileIssues["ScriptErrorCount"] > 100) {
          suggestions.push({
            name: "Fix Mobile JavaScript Errors",
            hypothesis: "By fixing script errors, we will improve user experience and conversions",
            priority: "CRITICAL",
            expectedImpact: "+20-30% mobile conversions",
            targetDevice: "Mobile",
            basedOn: `${mobileIssues["ScriptErrorCount"]} script errors detected`,
          });
        }

        if (mobileIssues["QuickbackCount"] > 100) {
          suggestions.push({
            name: "Above-the-Fold Content Improvement",
            hypothesis: "By showing the most relevant content immediately, we will reduce quickbacks and increase engagement",
            priority: "MEDIUM",
            expectedImpact: "+8-12% time on page",
            targetDevice: "Mobile",
            basedOn: `${mobileIssues["QuickbackCount"]} quickbacks detected`,
          });
        }

        suggestions.push({
          name: "Mobile Form Simplification",
          hypothesis: "By reducing form fields and using autofill, we will increase mobile conversions",
          priority: "MEDIUM",
          expectedImpact: "+10-20% form completion",
          targetDevice: "Mobile",
          basedOn: "CRO best practices for mobile",
        });

        const maxSuggestions = (toolInput.max_suggestions as number) || 5;

        // Filter by focus area if specified
        let filtered = suggestions;
        if (toolInput.focus_area) {
          switch (toolInput.focus_area) {
            case "mobile":
              filtered = suggestions.filter(s => s.targetDevice === "Mobile");
              break;
            case "desktop":
              filtered = suggestions.filter(s => s.targetDevice === "Desktop");
              break;
            case "ux_issues":
              filtered = suggestions.filter(s => s.basedOn.includes("clicks") || s.basedOn.includes("errors"));
              break;
          }
        }

        return filtered.slice(0, maxSuggestions);
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool ${toolName} error:`, error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ============================================
// SYSTEM PROMPT
// ============================================

const systemPrompt = `You are a CRO Expert AI, a consultant specializing in Conversion Rate Optimization with 15+ years of experience.

You have access to real Microsoft Clarity data that tracks:
- Sessions and users by device (Mobile, Desktop, Tablet)
- UX issues: dead clicks, rage clicks, quickbacks, script errors
- Engagement metrics: time on page, scroll depth, pages per session
- Bot traffic

Your task is to:
1. Understand what the user wants to know about CRO data
2. Use available tools to retrieve real data
3. Analyze the data and identify problems and opportunities
4. Provide actionable recommendations with priorities

Guidelines:
- ALWAYS respond in English
- Use markdown tables to present data
- Highlight critical issues with 🚨
- Always suggest specific A/B tests
- Calculate estimated impact when possible
- Be direct and practical, not generic

Response structure:
- Use ## for main sections
- Use ### for subsections
- Use bullet points for lists
- Use **bold** for important metrics
- Add emojis to make responses more readable

Never invent data - always use tools to retrieve real information from the database.`;

// ============================================
// MAIN API HANDLER (AGENTIC LOOP)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: "user", content: message },
    ];

    let currentMessages = messages;
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages: currentMessages,
      });

      // Claude ha finito
      if (response.stop_reason === "end_turn") {
        const textContent = response.content.find((c) => c.type === "text");
        return NextResponse.json({
          success: true,
          response: textContent ? (textContent as Anthropic.TextBlock).text : "",
          conversationHistory: [
            ...currentMessages,
            { role: "assistant", content: response.content },
          ],
        });
      }

      // Claude vuole usare tools
      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`🔧 Executing tool: ${toolUse.name}`, toolUse.input);
          
          const result = await executeToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result, null, 2),
          });
        }

        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ];
      }
    }

    return NextResponse.json(
      { error: "Max iterations reached" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
