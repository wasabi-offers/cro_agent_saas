"use client";

import { useState } from "react";
import { AlertTriangle, TrendingDown, TrendingUp, Info, AlertCircle } from "lucide-react";

interface Anomaly {
  id: string;
  metric: string;
  type: "spike" | "drop" | "unusual_pattern";
  severity: "critical" | "warning" | "info";
  currentValue: number;
  expectedValue: number;
  deviation: number;
  description: string;
  possibleCauses: string[];
  recommendation: string;
  detectedAt: string;
}

interface AnomalyDetectionProps {
  anomalies?: Anomaly[];
}

export default function AnomalyDetection({ anomalies }: AnomalyDetectionProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  // Mock anomalies
  const defaultAnomalies: Anomaly[] = [
    {
      id: "1",
      metric: "Bounce Rate",
      type: "spike",
      severity: "critical",
      currentValue: 72.4,
      expectedValue: 45.2,
      deviation: 60.2,
      description: "Bounce rate spiked 60% above normal levels in the last 3 hours",
      possibleCauses: [
        "Slow page load time detected",
        "Recent deployment may have introduced bugs",
        "Traffic from low-quality source",
      ],
      recommendation: "Check recent code deployments and page performance. Review traffic sources for unusual patterns.",
      detectedAt: "2026-01-08T14:30:00",
    },
    {
      id: "2",
      metric: "Conversion Rate",
      type: "drop",
      severity: "critical",
      currentValue: 2.1,
      expectedValue: 4.8,
      deviation: -56.3,
      description: "Conversion rate dropped 56% below baseline",
      possibleCauses: [
        "Payment gateway issues",
        "Checkout page errors",
        "CTA buttons not working",
      ],
      recommendation: "Immediately check checkout flow and payment integration. Test critical user journeys.",
      detectedAt: "2026-01-08T13:15:00",
    },
    {
      id: "3",
      metric: "Average Session Duration",
      type: "drop",
      severity: "warning",
      currentValue: 92,
      expectedValue: 156,
      deviation: -41.0,
      description: "Users are spending 41% less time on site than expected",
      possibleCauses: [
        "Content quality issues",
        "Navigation problems",
        "Mobile UX degradation",
      ],
      recommendation: "Review recent content changes. Check mobile responsiveness and navigation flow.",
      detectedAt: "2026-01-08T12:00:00",
    },
    {
      id: "4",
      metric: "Page Load Time",
      type: "spike",
      severity: "warning",
      currentValue: 4.8,
      expectedValue: 2.1,
      deviation: 128.6,
      description: "Page load time increased by 128%, now averaging 4.8s",
      possibleCauses: [
        "CDN issues",
        "Unoptimized images",
        "Third-party script delays",
      ],
      recommendation: "Check CDN status. Review and optimize recently added assets. Audit third-party scripts.",
      detectedAt: "2026-01-08T11:45:00",
    },
    {
      id: "5",
      metric: "Mobile Traffic",
      type: "unusual_pattern",
      severity: "info",
      currentValue: 68,
      expectedValue: 52,
      deviation: 30.8,
      description: "Mobile traffic share increased 30% - unusual but potentially positive",
      possibleCauses: [
        "Successful mobile campaign",
        "Viral mobile content",
        "Desktop site issues",
      ],
      recommendation: "Monitor mobile conversion rates. Ensure mobile experience can handle increased load.",
      detectedAt: "2026-01-08T10:30:00",
    },
  ];

  const displayAnomalies = anomalies || defaultAnomalies;

  const getSeverityColor = (severity: Anomaly["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-[#EF4444]/10",
          border: "border-[#EF4444]/30",
          text: "text-[#EF4444]",
          icon: "#EF4444",
        };
      case "warning":
        return {
          bg: "bg-[#f59e0b]/10",
          border: "border-[#f59e0b]/30",
          text: "text-[#f59e0b]",
          icon: "#f59e0b",
        };
      case "info":
        return {
          bg: "bg-[#6366F1]/10",
          border: "border-[#6366F1]/30",
          text: "text-[#6366F1]",
          icon: "#6366F1",
        };
    }
  };

  const getTypeIcon = (type: Anomaly["type"], severity: Anomaly["severity"]) => {
    const colors = getSeverityColor(severity);
    switch (type) {
      case "spike":
        return <TrendingUp className="w-5 h-5" style={{ color: colors.icon }} />;
      case "drop":
        return <TrendingDown className="w-5 h-5" style={{ color: colors.icon }} />;
      case "unusual_pattern":
        return <Info className="w-5 h-5" style={{ color: colors.icon }} />;
    }
  };

  return (
    <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl overflow-hidden mb-10">
      {/* Header */}
      <div className="p-6 border-b border-[#1E293B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
            <div>
              <h3 className="text-[18px] font-semibold text-[#F8FAFC]">
                Anomaly Detection
              </h3>
              <p className="text-[13px] text-[#94A3B8]">
                Real-time alerts for unusual metric behavior
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
              <span className="text-[12px] text-[#94A3B8]">
                {displayAnomalies.filter(a => a.severity === 'critical').length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
              <span className="text-[12px] text-[#94A3B8]">
                {displayAnomalies.filter(a => a.severity === 'warning').length} Warning
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="divide-y divide-[#1E293B]">
        {displayAnomalies.map((anomaly) => {
          const colors = getSeverityColor(anomaly.severity);

          return (
            <div
              key={anomaly.id}
              className="p-6 hover:bg-[#111827]/50 transition-all cursor-pointer"
              onClick={() => setSelectedAnomaly(anomaly)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                  {getTypeIcon(anomaly.type, anomaly.severity)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-[16px] font-semibold text-[#F8FAFC]">
                          {anomaly.metric}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#94A3B8]">
                        {anomaly.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-[24px] font-bold ${colors.text}`}>
                        {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-[#64748B]">deviation</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#64748B]">Current:</span>
                      <span className="text-[13px] font-semibold text-[#F8FAFC]">
                        {anomaly.currentValue}{anomaly.metric.includes('Rate') ? '%' : anomaly.metric.includes('Time') ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#64748B]">Expected:</span>
                      <span className="text-[13px] font-semibold text-[#94A3B8]">
                        {anomaly.expectedValue}{anomaly.metric.includes('Rate') ? '%' : anomaly.metric.includes('Time') ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#64748B]">Detected:</span>
                      <span className="text-[12px] text-[#94A3B8]">
                        {new Date(anomaly.detectedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0B0F19] border-b border-[#1E293B] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[20px] font-semibold text-[#F8FAFC] mb-1">
                    {selectedAnomaly.metric} Anomaly
                  </h3>
                  <p className="text-[13px] text-[#94A3B8]">
                    Detected {new Date(selectedAnomaly.detectedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="p-2 hover:bg-[#111827] rounded-lg transition-all"
                >
                  <AlertCircle className="w-5 h-5 text-[#94A3B8]" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B] uppercase mb-1">Current</div>
                  <div className="text-[24px] font-bold text-[#EF4444]">
                    {selectedAnomaly.currentValue}
                    {selectedAnomaly.metric.includes('Rate') ? '%' : ''}
                  </div>
                </div>
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B] uppercase mb-1">Expected</div>
                  <div className="text-[24px] font-bold text-[#94A3B8]">
                    {selectedAnomaly.expectedValue}
                    {selectedAnomaly.metric.includes('Rate') ? '%' : ''}
                  </div>
                </div>
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B] uppercase mb-1">Deviation</div>
                  <div className="text-[24px] font-bold text-[#f59e0b]">
                    {selectedAnomaly.deviation > 0 ? '+' : ''}{selectedAnomaly.deviation.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Possible Causes */}
              <div>
                <h4 className="text-[14px] font-semibold text-[#F8FAFC] mb-3">
                  Possible Causes
                </h4>
                <div className="space-y-2">
                  {selectedAnomaly.possibleCauses.map((cause, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-[#111827] border border-[#1E293B] rounded-lg p-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0"></div>
                      <p className="text-[13px] text-[#94A3B8]">{cause}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <h4 className="text-[14px] font-semibold text-[#F8FAFC] mb-3">
                  Recommended Action
                </h4>
                <div className="bg-gradient-to-r from-[#6366F1]/10 to-[#06B6D4]/10 border border-[#6366F1]/30 rounded-xl p-4">
                  <p className="text-[14px] text-[#F8FAFC] leading-relaxed">
                    {selectedAnomaly.recommendation}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button className="flex-1 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white px-4 py-3 rounded-xl text-[14px] font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
                  Create Alert Rule
                </button>
                <button className="px-4 py-3 bg-[#111827] border border-[#1E293B] text-[#F8FAFC] rounded-xl text-[14px] font-medium hover:bg-[#1E293B] transition-all">
                  Investigate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
