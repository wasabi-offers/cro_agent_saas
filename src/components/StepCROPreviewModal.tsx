"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Eye, Loader2 } from "lucide-react";

interface StepCROPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepName: string;
  stepUrl: string;
}

interface CROInsight {
  category: string;
  insight: string;
  urgency: string;
}

export default function StepCROPreviewModal({
  isOpen,
  onClose,
  stepName,
  stepUrl,
}: StepCROPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [urgentItems, setUrgentItems] = useState<CROInsight[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !stepUrl) return;
    setLoading(true);
    setUrgentItems([]);
    setError("");

    fetch("/api/analyze-landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: stepUrl,
        filters: ["cro", "copy", "experience"],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        const items: CROInsight[] = [];
        (data.results || []).forEach((r: any) => {
          (r.insights || []).slice(0, 2).forEach((insight: string) => {
            items.push({
              category: r.category || "CRO",
              insight,
              urgency: "urgent",
            });
          });
        });
        setUrgentItems(items.slice(0, 5));
      })
      .catch((e) => setError(e.message || "Analysis failed"))
      .finally(() => setLoading(false));
  }, [isOpen, stepUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#d0d0d0] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#d0d0d0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-[#F97316]" />
            <h2 className="text-[18px] font-semibold text-[#1a1a1a]">CRO Preview - {stepName}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f3f5] text-[#888888]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Page Preview */}
          <div className="p-4 border-b border-[#d0d0d0]">
            <h4 className="text-[12px] text-[#888888] mb-2">Page Preview</h4>
            <div className="relative rounded-lg overflow-hidden border border-[#333] bg-[#1a1a1a]" style={{ height: 220 }}>
              <iframe
                src={`/api/proxy-page?url=${encodeURIComponent(stepUrl)}&scripts=1`}
                title={`Preview: ${stepName}`}
                referrerPolicy="no-referrer"
                className="absolute top-0 left-0 border-0 pointer-events-none"
                style={{
                  width: "1280px",
                  height: "800px",
                  transform: "scale(0.27)",
                  transformOrigin: "top left",
                }}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>

          {/* Ultra Urgent CRO Items */}
          <div className="p-6">
            <h4 className="text-[14px] font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ff6b6b]" />
              Ultra Urgent – Change Immediately
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
              </div>
            ) : error ? (
              <p className="text-[13px] text-[#ff6b6b]">{error}</p>
            ) : urgentItems.length === 0 ? (
              <p className="text-[13px] text-[#888888]">No urgent items detected. Run full CRO Analysis for detailed insights.</p>
            ) : (
              <div className="space-y-3">
                {urgentItems.map((item: CROInsight, i: number) => (
                  <div
                    key={i}
                    className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"
                  >
                    <span className="text-[10px] text-[#ff6b6b] font-medium uppercase">{item.category}</span>
                    <p className="text-[13px] text-[#1a1a1a] mt-1 leading-relaxed">{item.insight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
