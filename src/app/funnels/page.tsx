"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  generateMockFunnels,
  ConversionFunnel,
} from "@/lib/mock-data";

export default function FunnelsListPage() {
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // In production: const res = await fetch('/api/funnels');
      const data = generateMockFunnels();
      setFunnels(data);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const getFunnelStatus = (funnel: ConversionFunnel) => {
    const hasCriticalDropoff = funnel.steps.some(step => step.dropoff > 50);
    return hasCriticalDropoff;
  };

  const getCriticalStep = (funnel: ConversionFunnel) => {
    return funnel.steps.reduce((max, step) =>
      step.dropoff > max.dropoff ? step : max, funnel.steps[0]
    );
  };

  // Generate bounce rate (mock data - in production this comes from API)
  const getBounceRate = (funnelId: string) => {
    const rates: Record<string, number> = {
      'checkout_funnel': 52.8,           // Red - High bounce
      'lead_gen_funnel': 42.8,           // Yellow - Medium bounce
      'blog_to_newsletter': 26.5,        // Green - Low bounce
      'saas_signup': 28.2,               // Green - Low bounce
      'mobile_app_install': 68.5,        // Red - Very high bounce
      'webinar_registration': 38.4,      // Yellow - Medium bounce
      'premium_upgrade': 31.2,           // Green - Low bounce
      'quote_request': 45.6,             // Yellow - Medium bounce
      'demo_booking': 58.3,              // Red - High bounce
      'course_enrollment': 41.7,         // Yellow - Medium bounce
    };
    return rates[funnelId] || 30;
  };

  // Determine card border color based on health metrics
  const getCardBorderClass = (conversionRate: number, bounceRate: number, criticalDropoff: number) => {
    // Good: High CR (>10%), Low bounce (<35%), Low critical dropoff (<40%)
    if (conversionRate >= 10 && bounceRate < 35 && criticalDropoff < 40) {
      return "border-[#00d4aa] hover:border-[#00d4aa]";
    }
    // Bad: Low CR (<5%), High bounce (>50%), High critical dropoff (>60%)
    if (conversionRate < 5 || bounceRate > 50 || criticalDropoff > 60) {
      return "border-[#ff6b6b] hover:border-[#ff6b6b]";
    }
    // Warning: Everything else
    return "border-[#f59e0b] hover:border-[#f59e0b]";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Funnels" breadcrumb={["Dashboard", "Funnels"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading funnels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="Funnels" breadcrumb={["Dashboard", "Funnels"]} />

      <div className="p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#fafafa] mb-2">Conversion Funnels</h1>
            <p className="text-[15px] text-[#888888]">
              Monitor all your conversion funnels and identify optimization opportunities
            </p>
          </div>
        </div>

        {/* Funnels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {funnels.map((funnel) => {
            const firstStep = funnel.steps[0];
            const lastStep = funnel.steps[funnel.steps.length - 1];
            const hasIssues = getFunnelStatus(funnel);
            const criticalStep = getCriticalStep(funnel);
            const totalLost = firstStep.visitors - lastStep.visitors;
            const bounceRate = getBounceRate(funnel.id);
            const borderClass = getCardBorderClass(funnel.conversionRate, bounceRate, criticalStep.dropoff);

            return (
              <Link
                key={funnel.id}
                href={`/funnels/${funnel.id}`}
                className={`group bg-[#0a0a0a] border-2 rounded-2xl p-8 transition-all hover:shadow-lg ${borderClass}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#fafafa] group-hover:text-[#7c5cff] transition-colors">
                        {funnel.name}
                      </h3>
                      <p className="text-[12px] text-[#666666]">{funnel.steps.length} steps</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666666] group-hover:text-[#7c5cff] group-hover:translate-x-1 transition-all" />
                </div>

                {/* Main Metric */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[36px] font-bold text-[#fafafa]">
                      {funnel.conversionRate.toFixed(1)}%
                    </span>
                    {funnel.conversionRate >= 10 ? (
                      <TrendingUp className="w-5 h-5 text-[#00d4aa]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#ff6b6b]" />
                    )}
                  </div>
                  <p className="text-[13px] text-[#888888]">Conversion Rate</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#111111] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-[#7c5cff]" />
                      <span className="text-[12px] text-[#888888]">Visitors</span>
                    </div>
                    <p className="text-[20px] font-bold text-[#fafafa]">
                      {firstStep.visitors.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#111111] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-[#00d4aa]" />
                      <span className="text-[12px] text-[#888888]">Converted</span>
                    </div>
                    <p className="text-[20px] font-bold text-[#00d4aa]">
                      {lastStep.visitors.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#111111] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#f59e0b]" />
                      <span className="text-[12px] text-[#888888]">Bounce Rate</span>
                    </div>
                    <p className={`text-[20px] font-bold ${bounceRate < 35 ? 'text-[#00d4aa]' : bounceRate > 50 ? 'text-[#ff6b6b]' : 'text-[#f59e0b]'}`}>
                      {bounceRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
                  {hasIssues ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30">
                        <AlertCircle className="w-3 h-3" />
                        ISSUES
                      </span>
                      <span className="text-[11px] text-[#666666]">
                        {criticalStep.name}: -{criticalStep.dropoff}%
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      HEALTHY
                    </span>
                  )}

                  <span className="text-[11px] text-[#888888] flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    View Details
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {funnels.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-[#666666]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-2">No Funnels Found</h3>
            <p className="text-[14px] text-[#666666] mb-6">
              Create your first conversion funnel to start tracking user journeys
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl font-medium text-[14px] hover:shadow-lg hover:shadow-purple-500/20 transition-all">
              Create Funnel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
