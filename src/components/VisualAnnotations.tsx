"use client";

import { useState } from "react";
import { X, AlertCircle, CheckCircle, Info, TrendingUp, ZoomIn, ZoomOut } from "lucide-react";

interface Annotation {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  type: "critical" | "warning" | "success" | "info";
  category: string;
  title: string;
  description: string;
  recommendation: string;
  impact: "high" | "medium" | "low";
}

interface VisualAnnotationsProps {
  screenshotUrl?: string;
  pageUrl: string;
  annotations: Annotation[];
}

export default function VisualAnnotations({
  screenshotUrl,
  pageUrl,
  annotations,
}: VisualAnnotationsProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [zoom, setZoom] = useState(100);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getAnnotationColor = (type: Annotation["type"]) => {
    switch (type) {
      case "critical":
        return { bg: "bg-[#ff6b6b]", border: "border-[#ff6b6b]", text: "text-[#ff6b6b]" };
      case "warning":
        return { bg: "bg-[#f59e0b]", border: "border-[#f59e0b]", text: "text-[#f59e0b]" };
      case "success":
        return { bg: "bg-[#00d4aa]", border: "border-[#00d4aa]", text: "text-[#00d4aa]" };
      case "info":
        return { bg: "bg-[#7c5cff]", border: "border-[#7c5cff]", text: "text-[#7c5cff]" };
    }
  };

  const getAnnotationIcon = (type: Annotation["type"]) => {
    switch (type) {
      case "critical":
        return AlertCircle;
      case "warning":
        return AlertCircle;
      case "success":
        return CheckCircle;
      case "info":
        return Info;
    }
  };

  const getImpactBadge = (impact: Annotation["impact"]) => {
    const colors = {
      high: "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30",
      medium: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
      low: "bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30",
    };
    return colors[impact];
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">
              Visual Page Analysis
            </h3>
            <p className="text-[13px] text-[#888888]">
              Click on markers to view detailed insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-2 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-all"
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4 text-[#888888]" />
            </button>
            <span className="text-[13px] text-[#888888] min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-2 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-all"
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4 text-[#888888]" />
            </button>
          </div>
        </div>

        {/* Annotation Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
            <span className="text-[12px] text-[#888888]">
              {annotations.filter(a => a.type === 'critical').length} Critical
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
            <span className="text-[12px] text-[#888888]">
              {annotations.filter(a => a.type === 'warning').length} Warnings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00d4aa]"></div>
            <span className="text-[12px] text-[#888888]">
              {annotations.filter(a => a.type === 'success').length} Good
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7c5cff]"></div>
            <span className="text-[12px] text-[#888888]">
              {annotations.filter(a => a.type === 'info').length} Info
            </span>
          </div>
        </div>
      </div>

      {/* Screenshot Container */}
      <div className="relative bg-[#111111] overflow-auto" style={{ maxHeight: '800px' }}>
        <div
          className="relative mx-auto transition-all duration-300"
          style={{
            width: `${zoom}%`,
            minHeight: '600px',
          }}
        >
          {/* Screenshot or iframe */}
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt="Page screenshot"
              className="w-full h-auto"
            />
          ) : pageUrl ? (
            <iframe
              src={`/api/proxy-page?url=${encodeURIComponent(pageUrl)}`}
              className="w-full h-[800px] bg-white border border-[#2a2a2a]"
              title="Page preview"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          ) : (
            <div className="w-full h-[800px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center border border-[#2a2a2a]">
              <div className="text-center">
                <div className="text-[48px] mb-3">📄</div>
                <p className="text-[14px] text-[#666666] mb-2">No URL provided</p>
                <p className="text-[12px] text-[#555555] max-w-[300px]">
                  Enter a URL to preview the page
                </p>
              </div>
            </div>
          )}

          {/* Annotation Markers */}
          {annotations.map((annotation) => {
            const colors = getAnnotationColor(annotation.type);
            const Icon = getAnnotationIcon(annotation.type);
            const isHovered = hoveredId === annotation.id;
            const isSelected = selectedAnnotation?.id === annotation.id;

            return (
              <div
                key={annotation.id}
                className="absolute cursor-pointer"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => setSelectedAnnotation(annotation)}
                onMouseEnter={() => setHoveredId(annotation.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Marker */}
                <div
                  className={`relative flex items-center justify-center transition-all duration-200 ${
                    isSelected || isHovered ? 'scale-125' : 'scale-100'
                  }`}
                >
                  {/* Pulse Animation */}
                  {annotation.type === 'critical' && (
                    <div className={`absolute w-8 h-8 ${colors.bg} rounded-full opacity-50 animate-ping`} />
                  )}

                  {/* Marker Circle */}
                  <div
                    className={`w-8 h-8 ${colors.bg} rounded-full border-2 border-white shadow-lg flex items-center justify-center z-10`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Quick Tooltip on Hover */}
                  {isHovered && !selectedAnnotation && (
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-3 w-64 z-20 shadow-xl">
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors.bg} text-white`}>
                          {annotation.type}
                        </div>
                        <div className={`px-2 py-0.5 rounded border text-[10px] font-medium ${getImpactBadge(annotation.impact)}`}>
                          {annotation.impact} impact
                        </div>
                      </div>
                      <p className="text-[13px] font-semibold text-[#fafafa] mb-1">
                        {annotation.title}
                      </p>
                      <p className="text-[11px] text-[#888888]">
                        Click for details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annotation Detail Modal */}
      {selectedAnnotation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#2a2a2a] p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-2.5 py-1 rounded-lg border ${getAnnotationColor(selectedAnnotation.type).bg} text-white text-[11px] font-bold uppercase`}>
                    {selectedAnnotation.type}
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${getImpactBadge(selectedAnnotation.impact)}`}>
                    {selectedAnnotation.impact} impact
                  </div>
                  <span className="text-[12px] text-[#666666]">
                    {selectedAnnotation.category}
                  </span>
                </div>
                <h3 className="text-[20px] font-semibold text-[#fafafa]">
                  {selectedAnnotation.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnnotation(null)}
                className="p-2 hover:bg-[#111111] rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-[#888888]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-[13px] font-semibold text-[#888888] uppercase tracking-wide mb-2">
                  Issue Description
                </h4>
                <p className="text-[15px] text-[#fafafa] leading-relaxed">
                  {selectedAnnotation.description}
                </p>
              </div>

              {/* Recommendation */}
              <div>
                <h4 className="text-[13px] font-semibold text-[#888888] uppercase tracking-wide mb-2">
                  Recommendation
                </h4>
                <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[14px] text-[#fafafa] leading-relaxed">
                      {selectedAnnotation.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button className="flex-1 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white px-4 py-3 rounded-xl text-[14px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                  Create A/B Test
                </button>
                <button className="px-4 py-3 bg-[#111111] border border-[#2a2a2a] text-[#fafafa] rounded-xl text-[14px] font-medium hover:bg-[#1a1a1a] transition-all">
                  Add to Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
