"use client";

import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Info } from "lucide-react";

interface Alert {
  id: string;
  type: "critical" | "warning" | "success" | "info";
  title: string;
  description: string;
  metric: string;
  change: string;
  timestamp: string;
}

export default function AlertsSection() {
  // Mock alerts - in production these would come from anomaly detection algorithm
  const alerts: Alert[] = [
    {
      id: "1",
      type: "critical",
      title: "Checkout Funnel Drop Detected",
      description: "Conversion rate dropped 22% compared to yesterday",
      metric: "Checkout Funnel",
      change: "-22%",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      type: "warning",
      title: "Mobile Bounce Rate Increasing",
      description: "Bounce rate increased by 15% in the last 3 days",
      metric: "Mobile Traffic",
      change: "+15%",
      timestamp: "5 hours ago"
    },
    {
      id: "3",
      type: "success",
      title: "Desktop Conversions Up",
      description: "Desktop conversions improved 18% this week",
      metric: "Desktop Traffic",
      change: "+18%",
      timestamp: "1 day ago"
    }
  ];

  const getAlertConfig = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return {
          bg: "bg-[#ff6b6b]/10",
          border: "border-[#ff6b6b]/30",
          icon: AlertTriangle,
          iconColor: "text-[#ff6b6b]",
          iconBg: "bg-[#ff6b6b]/20"
        };
      case "warning":
        return {
          bg: "bg-[#f59e0b]/10",
          border: "border-[#f59e0b]/30",
          icon: TrendingDown,
          iconColor: "text-[#f59e0b]",
          iconBg: "bg-[#f59e0b]/20"
        };
      case "success":
        return {
          bg: "bg-[#00d4aa]/10",
          border: "border-[#00d4aa]/30",
          icon: TrendingUp,
          iconColor: "text-[#00d4aa]",
          iconBg: "bg-[#00d4aa]/20"
        };
      case "info":
        return {
          bg: "bg-[#7c5cff]/10",
          border: "border-[#7c5cff]/30",
          icon: Info,
          iconColor: "text-[#7c5cff]",
          iconBg: "bg-[#7c5cff]/20"
        };
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] font-semibold text-[#fafafa]">Alerts & Anomalies</h3>
        <button className="text-[13px] text-[#7c5cff] hover:text-[#00d4aa] transition-colors">
          View All ({alerts.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert) => {
          const config = getAlertConfig(alert.type);
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`${config.bg} border ${config.border} rounded-xl p-5 hover:border-opacity-50 transition-all cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <span className="text-[11px] text-[#888888]">{alert.timestamp}</span>
              </div>

              <h4 className="text-[15px] font-semibold text-[#fafafa] mb-1">
                {alert.title}
              </h4>
              <p className="text-[13px] text-[#888888] mb-3">
                {alert.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#666666]">{alert.metric}</span>
                <span className={`text-[14px] font-bold ${config.iconColor}`}>
                  {alert.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
