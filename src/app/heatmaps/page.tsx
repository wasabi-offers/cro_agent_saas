"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  MousePointerClick,
  Move,
  ArrowDown,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  generateMockHeatmaps,
  generateMockPageMetrics,
  HeatmapData,
  PageMetrics,
} from "@/lib/mock-data";

export default function HeatmapsPage() {
  const [heatmaps, setHeatmaps] = useState<HeatmapData[]>([]);
  const [pageMetrics, setPageMetrics] = useState<PageMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<string>('/');
  const [selectedType, setSelectedType] = useState<'click' | 'scroll' | 'move'>('click');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const heatmapData = generateMockHeatmaps();
      const pages = generateMockPageMetrics();
      setHeatmaps(heatmapData);
      setPageMetrics(pages);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'click':
        return <MousePointerClick className="w-4 h-4" />;
      case 'scroll':
        return <ArrowDown className="w-4 h-4" />;
      case 'move':
        return <Move className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const currentHeatmap = heatmaps.find(
    (h) => h.page === selectedPage && h.type === selectedType
  );

  const pages = [...new Set(heatmaps.map((h) => h.page))];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get color based on value intensity
  const getHeatColor = (value: number, maxValue: number) => {
    const intensity = value / maxValue;
    if (intensity > 0.8) return 'bg-[#ff0000]';
    if (intensity > 0.6) return 'bg-[#ff6600]';
    if (intensity > 0.4) return 'bg-[#ffcc00]';
    if (intensity > 0.2) return 'bg-[#00d4aa]';
    return 'bg-[#7c5cff]';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Heatmaps" breadcrumb={["Dashboard", "Heatmaps"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading heatmaps...</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = currentHeatmap
    ? Math.max(...currentHeatmap.data.map((d) => d.value))
    : 100;

  return (
    <div className="min-h-screen bg-black">
      <Header title="Heatmaps" breadcrumb={["Dashboard", "Heatmaps"]} />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-[#fafafa] mb-2">Heatmap Analysis</h1>
            <p className="text-[14px] text-[#666666]">
              Click, scroll, and mouse movement data from Clarity & Crazy Egg
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-[#111111] border border-white/10 text-[#fafafa] text-[14px] font-medium rounded-xl hover:bg-[#1a1a1a] transition-all">
            <RefreshCw className="w-4 h-4" />
            Sync Data
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-[#0a0a0a] border border-white/10 rounded-xl">
          {/* Page Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] text-[#666666] uppercase tracking-wide block mb-2">
              Select Page
            </label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full bg-[#111111] border border-white/20 rounded-lg px-4 py-2.5 text-[14px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff] transition-colors"
            >
              {pages.map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector */}
          <div>
            <label className="text-[11px] text-[#666666] uppercase tracking-wide block mb-2">
              Heatmap Type
            </label>
            <div className="flex gap-2">
              {(['click', 'scroll', 'move'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all capitalize ${
                    selectedType === type
                      ? 'bg-[#7c5cff] text-white'
                      : 'bg-[#111111] text-[#888888] hover:bg-[#1a1a1a] hover:text-[#fafafa]'
                  }`}
                >
                  {getTypeIcon(type)}
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heatmap Visualization */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-[#fafafa]">
                  {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Heatmap
                </h2>
                <p className="text-[12px] text-[#666666] mt-1">
                  Page: {selectedPage}
                </p>
              </div>
              {currentHeatmap && (
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-[#888888]">
                    {currentHeatmap.totalSessions.toLocaleString()} sessions
                  </span>
                  <span className="text-[12px] text-[#555555] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(currentHeatmap.lastUpdated)}
                  </span>
                </div>
              )}
            </div>

            {/* Heatmap Canvas */}
            <div className="relative h-[600px] bg-[#111111] m-4 rounded-xl overflow-hidden">
              {/* Simulated Page Preview */}
              <div className="absolute inset-0 p-4">
                {/* Header */}
                <div className="h-16 bg-[#1a1a1a] rounded-lg mb-4 flex items-center px-4">
                  <div className="w-24 h-6 bg-[#2a2a2a] rounded" />
                  <div className="flex-1 flex justify-end gap-4">
                    <div className="w-16 h-4 bg-[#2a2a2a] rounded" />
                    <div className="w-16 h-4 bg-[#2a2a2a] rounded" />
                    <div className="w-16 h-4 bg-[#2a2a2a] rounded" />
                  </div>
                </div>

                {/* Hero */}
                <div className="h-48 bg-[#1a1a1a] rounded-lg mb-4 flex flex-col items-center justify-center">
                  <div className="w-64 h-8 bg-[#2a2a2a] rounded mb-4" />
                  <div className="w-96 h-4 bg-[#222222] rounded mb-2" />
                  <div className="w-80 h-4 bg-[#222222] rounded mb-6" />
                  <div className="w-32 h-10 bg-[#7c5cff]/30 rounded-lg" />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-[#1a1a1a] rounded-lg p-4">
                      <div className="w-full h-20 bg-[#2a2a2a] rounded mb-3" />
                      <div className="w-3/4 h-3 bg-[#222222] rounded mb-2" />
                      <div className="w-1/2 h-3 bg-[#222222] rounded" />
                    </div>
                  ))}
                </div>

                {/* CTA Section */}
                <div className="h-32 bg-[#1a1a1a] rounded-lg flex items-center justify-center gap-4">
                  <div className="w-48 h-4 bg-[#2a2a2a] rounded" />
                  <div className="w-28 h-10 bg-[#00d4aa]/30 rounded-lg" />
                </div>
              </div>

              {/* Heatmap Dots */}
              {currentHeatmap?.data.map((point, index) => (
                <div
                  key={index}
                  className={`absolute rounded-full ${getHeatColor(point.value, maxValue)} opacity-60 blur-sm`}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: `${Math.max(20, point.value / 2)}px`,
                    height: `${Math.max(20, point.value / 2)}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-[#0a0a0a]/90 border border-white/10 rounded-lg p-3">
                <p className="text-[10px] text-[#666666] uppercase mb-2">Intensity</p>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-[#7c5cff]" />
                  <div className="w-4 h-4 rounded bg-[#00d4aa]" />
                  <div className="w-4 h-4 rounded bg-[#ffcc00]" />
                  <div className="w-4 h-4 rounded bg-[#ff6600]" />
                  <div className="w-4 h-4 rounded bg-[#ff0000]" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-[#555555]">Low</span>
                  <span className="text-[9px] text-[#555555]">High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Page Stats */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-[16px] font-semibold text-[#fafafa] mb-4">Page Statistics</h2>
              
              {(() => {
                const pageData = pageMetrics.find((p) => p.page === selectedPage);
                if (!pageData) return <p className="text-[#666666]">No data</p>;
                
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[13px] text-[#888888]">Page Views</span>
                      <span className="text-[14px] text-[#fafafa] font-medium">
                        {pageData.pageViews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[13px] text-[#888888]">Unique Visitors</span>
                      <span className="text-[14px] text-[#fafafa] font-medium">
                        {pageData.uniqueVisitors.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[13px] text-[#888888]">Bounce Rate</span>
                      <span className={`text-[14px] font-medium ${pageData.bounceRate > 50 ? 'text-[#ff6b6b]' : 'text-[#00d4aa]'}`}>
                        {pageData.bounceRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[13px] text-[#888888]">Avg Scroll Depth</span>
                      <span className="text-[14px] text-[#fafafa] font-medium">
                        {pageData.scrollDepth.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[13px] text-[#888888]">Total Clicks</span>
                      <span className="text-[14px] text-[#7c5cff] font-medium">
                        {pageData.clicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[13px] text-[#ff6b6b]">Rage Clicks</span>
                      <span className="text-[14px] text-[#ff6b6b] font-medium">
                        {pageData.rageClicks}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-[#f59e0b]">Dead Clicks</span>
                      <span className="text-[14px] text-[#f59e0b] font-medium">
                        {pageData.deadClicks}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Available Heatmaps */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-[16px] font-semibold text-[#fafafa] mb-4">Available Pages</h2>
              <div className="space-y-2">
                {pages.map((page) => {
                  const pageHeatmaps = heatmaps.filter((h) => h.page === page);
                  const totalSessions = pageHeatmaps.reduce((acc, h) => acc + h.totalSessions, 0) / 3;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setSelectedPage(page)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        selectedPage === page
                          ? 'bg-[#7c5cff]/20 border border-[#7c5cff]/30'
                          : 'bg-[#111111] hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <p className={`text-[13px] font-medium ${selectedPage === page ? 'text-[#fafafa]' : 'text-[#888888]'}`}>
                        {page}
                      </p>
                      <p className="text-[11px] text-[#555555]">
                        {totalSessions.toLocaleString()} sessions
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


