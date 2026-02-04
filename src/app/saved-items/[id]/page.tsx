"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import CROComparisonTable from "@/components/CROComparisonTable";
import CROExecutiveSummary from "@/components/CROExecutiveSummary";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  TrendingUp,
  Target,
  FileText,
  Folder,
} from "lucide-react";
import {
  SavedFunnel,
  SavedLandingPage,
  Category,
  funnelStorage,
  landingPageStorage,
  categoryStorage,
} from "@/lib/saved-items";

export default function SavedAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [item, setItem] = useState<SavedFunnel | SavedLandingPage | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [itemType, setItemType] = useState<'funnel' | 'page' | null>(null);

  useEffect(() => {
    if (!id) return;

    // Try to find in funnels first
    const funnel = funnelStorage.getById(id);
    if (funnel) {
      setItem(funnel);
      setItemType('funnel');
      const cat = categoryStorage.getAll().find(c => c.id === funnel.categoryId);
      if (cat) setCategory(cat);
      return;
    }

    // Try to find in landing pages
    const page = landingPageStorage.getById(id);
    if (page) {
      setItem(page);
      setItemType('page');
      const cat = categoryStorage.getAll().find(c => c.id === page.categoryId);
      if (cat) setCategory(cat);
      return;
    }
  }, [id]);

  if (!item || !item.analysis) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="Analysis Not Found" breadcrumb={["Archivio", "Analysis"]} />
        <div className="p-10 max-w-[1600px] mx-auto">
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-[#666666] mx-auto mb-4" />
            <p className="text-[16px] text-[#888888] mb-2">Analysis not found</p>
            <p className="text-[14px] text-[#666666] mb-6">
              The analysis you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/saved-items')}
              className="flex items-center gap-2 px-6 py-3 bg-[#7c5cff] hover:bg-[#6b4ce6] text-white rounded-xl text-[14px] font-medium transition-all mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Archive
            </button>
          </div>
        </div>
      </div>
    );
  }

  const analysis = item.analysis;
  const isFunnel = itemType === 'funnel';

  return (
    <div className="min-h-screen bg-white">
      <Header 
        title={isFunnel ? "Funnel Analysis" : "Landing Page Analysis"} 
        breadcrumb={["Archivio", item.name]} 
      />

      <div className="p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/saved-items')}
            className="flex items-center gap-2 text-[#888888] hover:text-[#fafafa] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px]">Back to Archive</span>
          </button>

          <div className="bg-[#0a0a0a] border border-[#e0e0e0] rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-[28px] font-bold text-[#fafafa] mb-3">{item.name}</h1>
                {category && (
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-[14px] text-[#888888]">{category.name}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#888888]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Saved {new Date(item.savedAt).toLocaleDateString()}</span>
                  </div>
                  {analysis.generatedAt && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Analysis generated {new Date(analysis.generatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#7c5cff]/20 hover:bg-[#7c5cff]/30 text-[#7c5cff] rounded-xl text-[13px] font-medium transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  View {isFunnel ? 'Funnel' : 'Page'}
                </a>
              )}
            </div>

            {/* Summary */}
            {analysis.summary && (
              <div className="pt-4 border-t border-[#e0e0e0]">
                <p className="text-[14px] text-[#fafafa] leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            {/* Expected Impact */}
            {analysis.expectedImpact && (
              <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[#00d4aa]" />
                  <h3 className="text-[16px] font-semibold text-[#fafafa]">Expected Impact</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-xl p-4">
                    <div className="text-[12px] text-[#888888] mb-1">Total Expected Lift</div>
                    <div className="text-[24px] font-bold text-[#00d4aa]">
                      {analysis.expectedImpact.totalLift}
                    </div>
                  </div>
                  <div className="bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-xl p-4">
                    <div className="text-[12px] text-[#888888] mb-1">Confidence Level</div>
                    <div className="text-[24px] font-bold text-[#7c5cff]">
                      {analysis.expectedImpact.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CRO Comparison Table */}
        {analysis.comparisonTable && analysis.comparisonTable.length > 0 ? (
          <div className="space-y-6">
            <CROComparisonTable rows={analysis.comparisonTable} />
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-[#e0e0e0] rounded-2xl p-12 text-center">
            <FileText className="w-16 h-16 text-[#666666] mx-auto mb-4" />
            <p className="text-[16px] text-[#888888] mb-2">No analysis data available</p>
            <p className="text-[14px] text-[#666666]">
              The analysis table is empty or incomplete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
