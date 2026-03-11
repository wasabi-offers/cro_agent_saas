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
      <div className="bg-white border border-[#CBD5E1] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#CBD5E1] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-[#6366F1]" />
            <h2 className="text-[18px] font-semibold text-[#0F172A]">CRO Preview - {stepName}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#94A3B8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Page Preview */}
          <div className="p-4 border-b border-[#CBD5E1]">
            <h4 className="text-[12px] text-[#94A3B8] mb-2">Page Preview</h4>
            <div className="relative rounded-lg overflow-hidden border border-[#333] bg-[#1E293B]" style={{ height: 220 }}>
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
            <h4 className="text-[14px] font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              Ultra Urgent – Change Immediately
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
              </div>
            ) : error ? (
              <p className="text-[13px] text-[#EF4444]">{error}</p>
            ) : urgentItems.length === 0 ? (
              <p className="text-[13px] text-[#94A3B8]">No urgent items detected. Run full CRO Analysis for detailed insights.</p>
            ) : (
              <div className="space-y-3">
                {urgentItems.map((item: CROInsight, i: number) => (
                  <div
                    key={i}
                    className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-4"
                  >
                    <span className="text-[10px] text-[#EF4444] font-medium uppercase">{item.category}</span>
                    <p className="text-[13px] text-[#0F172A] mt-1 leading-relaxed">{item.insight}</p>
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
