"use client";

import { TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";

interface Prediction {
  metric: string;
  current: number;
  predicted7d: number;
  predicted14d: number;
  predicted30d: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  impact: "positive" | "negative" | "neutral";
}

interface PredictiveAnalyticsProps {
  predictions?: Prediction[];
}

export default function PredictiveAnalytics({ predictions }: PredictiveAnalyticsProps) {
  const defaultPredictions: Prediction[] = [
    {
      metric: "Conversion Rate",
      current: 4.2,
      predicted7d: 4.5,
      predicted14d: 4.8,
      predicted30d: 5.1,
      confidence: 87,
      trend: "up",
      impact: "positive",
    },
    {
      metric: "Bounce Rate",
      current: 45.2,
      predicted7d: 43.8,
      predicted14d: 42.1,
      predicted30d: 40.5,
      confidence: 92,
      trend: "down",
      impact: "positive",
    },
    {
      metric: "Avg Session Duration",
      current: 156,
      predicted7d: 162,
      predicted14d: 168,
      predicted30d: 175,
      confidence: 78,
      trend: "up",
      impact: "positive",
    },
    {
      metric: "Page Load Time",
      current: 2.1,
      predicted7d: 2.3,
      predicted14d: 2.6,
      predicted30d: 3.1,
      confidence: 65,
      trend: "up",
      impact: "negative",
    },
  ];

  const displayPredictions = predictions || defaultPredictions;

  const getTrendColor = (impact: Prediction["impact"]) => {
    switch (impact) {
      case "positive":
        return "text-[#00d4aa]";
      case "negative":
        return "text-[#ff6b6b]";
      case "neutral":
        return "text-[#888888]";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-[#00d4aa]";
    if (confidence >= 60) return "text-[#f59e0b]";
    return "text-[#ff6b6b]";
  };

  const formatValue = (metric: string, value: number) => {
    if (metric.includes('Rate')) return `${value.toFixed(1)}%`;
    if (metric.includes('Duration')) return `${Math.floor(value)}s`;
    if (metric.includes('Time')) return `${value.toFixed(1)}s`;
    return value.toLocaleString();
  };

  const calculateChange = (current: number, predicted: number) => {
    const change = ((predicted - current) / current) * 100;
    return change;
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden mb-10">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[#7c5cff]" />
            <div>
              <h3 className="text-[18px] font-semibold text-[#fafafa]">
                Predictive Forecasting
              </h3>
              <p className="text-[13px] text-[#888888]">
                AI-powered predictions for the next 30 days
              </p>
            </div>
          </div>
          <div className="text-[11px] text-[#666666] bg-[#111111] px-3 py-1.5 rounded-lg">
            Updated 5 min ago
          </div>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6">
          {displayPredictions.map((prediction) => (
            <div
              key={prediction.metric}
              className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5"
            >
              {/* Metric Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-[16px] font-semibold text-[#fafafa]">
                    {prediction.metric}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {prediction.trend === "up" ? (
                      <TrendingUp className={`w-4 h-4 ${getTrendColor(prediction.impact)}`} />
                    ) : (
                      <TrendingDown className={`w-4 h-4 ${getTrendColor(prediction.impact)}`} />
                    )}
                    <span className={`text-[13px] font-medium ${getTrendColor(prediction.impact)}`}>
                      {prediction.trend === "up" ? "Increasing" : "Decreasing"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#666666]">Confidence:</span>
                  <span className={`text-[13px] font-bold ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence}%
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-4 gap-4">
                {/* Current */}
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
                  <div className="text-[11px] text-[#666666] uppercase mb-1">
                    Current
                  </div>
                  <div className="text-[20px] font-bold text-[#fafafa]">
                    {formatValue(prediction.metric, prediction.current)}
                  </div>
                  <div className="text-[11px] text-[#888888] mt-1">Baseline</div>
                </div>

                {/* 7 Days */}
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
                  <div className="text-[11px] text-[#666666] uppercase mb-1">
                    7 Days
                  </div>
                  <div className="text-[20px] font-bold text-[#fafafa]">
                    {formatValue(prediction.metric, prediction.predicted7d)}
                  </div>
                  <div className={`text-[11px] mt-1 ${getTrendColor(prediction.impact)}`}>
                    {calculateChange(prediction.current, prediction.predicted7d) > 0 ? '+' : ''}
                    {calculateChange(prediction.current, prediction.predicted7d).toFixed(1)}%
                  </div>
                </div>

                {/* 14 Days */}
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
                  <div className="text-[11px] text-[#666666] uppercase mb-1">
                    14 Days
                  </div>
                  <div className="text-[20px] font-bold text-[#fafafa]">
                    {formatValue(prediction.metric, prediction.predicted14d)}
                  </div>
                  <div className={`text-[11px] mt-1 ${getTrendColor(prediction.impact)}`}>
                    {calculateChange(prediction.current, prediction.predicted14d) > 0 ? '+' : ''}
                    {calculateChange(prediction.current, prediction.predicted14d).toFixed(1)}%
                  </div>
                </div>

                {/* 30 Days */}
                <div className="bg-[#0a0a0a] border border-[#7c5cff]/30 rounded-lg p-3">
                  <div className="text-[11px] text-[#888888] uppercase mb-1">
                    30 Days
                  </div>
                  <div className="text-[20px] font-bold text-[#7c5cff]">
                    {formatValue(prediction.metric, prediction.predicted30d)}
                  </div>
                  <div className={`text-[11px] font-semibold mt-1 ${getTrendColor(prediction.impact)}`}>
                    {calculateChange(prediction.current, prediction.predicted30d) > 0 ? '+' : ''}
                    {calculateChange(prediction.current, prediction.predicted30d).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mt-4">
                <div className="relative h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      prediction.impact === "positive"
                        ? "bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]"
                        : prediction.impact === "negative"
                        ? "bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b]"
                        : "bg-gradient-to-r from-[#888888] to-[#666666]"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(calculateChange(prediction.current, prediction.predicted30d)) * 2)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#7c5cff] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] text-[#fafafa] font-medium mb-1">
                About These Predictions
              </p>
              <p className="text-[12px] text-[#888888] leading-relaxed">
                Predictions are based on historical patterns, seasonality, and current trends. Confidence levels indicate the reliability of each forecast. Higher confidence means more consistent historical patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
