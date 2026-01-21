"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointer, MousePointerClick, Eye, ArrowDown } from "lucide-react";

// Import heatmap.js
// @ts-ignore
import h337 from "heatmap.js";

interface HeatmapPoint {
  x: number;
  y: number;
  value: number; // Intensity
}

interface HeatmapData {
  type: "click" | "scroll" | "movement";
  points: HeatmapPoint[];
  max: number; // Max value for normalization
}

interface HeatmapVisualizationProps {
  pageUrl: string;
  funnelId: string;
  stepName: string;
  heatmapType: "click" | "scroll" | "movement";
  width?: number;
  height?: number;
}

export default function HeatmapVisualization({
  pageUrl,
  funnelId,
  stepName,
  heatmapType,
  width = 1200,
  height = 800,
}: HeatmapVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const heatmapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Record<string, HeatmapData> | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showIframe, setShowIframe] = useState(true);

  // Initialize heatmap.js instance
  useEffect(() => {
    if (!containerRef.current || heatmapInstanceRef.current) return;

    const heatmapInstance = h337.create({
      container: containerRef.current,
      radius: 40,
      maxOpacity: 0.6,
      minOpacity: 0.1,
      blur: 0.75,
      gradient: {
        // Color gradient from cold (blue) to hot (red)
        "0.0": "blue",
        "0.25": "cyan",
        "0.5": "lime",
        "0.75": "yellow",
        "1.0": "red",
      },
    });

    heatmapInstanceRef.current = heatmapInstance;

    return () => {
      if (heatmapInstanceRef.current) {
        // Cleanup if needed
        heatmapInstanceRef.current = null;
      }
    };
  }, []);

  // Load heatmap data from API
  useEffect(() => {
    async function loadHeatmapData() {
      console.log('🔥 Loading heatmap data for:', { funnelId, stepName });

      setIsLoading(true);
      try {
        const url = `/api/heatmap-data?funnelId=${funnelId}&stepName=${encodeURIComponent(stepName)}`;
        console.log('📡 Fetching from:', url);

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Heatmap data loaded:', data);

          setHeatmapData({
            click: data.click,
            scroll: data.scroll,
            movement: data.movement,
          });
          setStats(data.stats);
        } else {
          console.error('❌ Failed to load heatmap data:', response.status);
          setHeatmapData(null);
        }
      } catch (error) {
        console.error("❌ Error loading heatmap data:", error);
        setHeatmapData(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadHeatmapData();
  }, [funnelId, stepName]);

  // Update heatmap visualization when type or data changes
  useEffect(() => {
    if (!heatmapInstanceRef.current || !heatmapData) return;

    const data = heatmapData[heatmapType];
    console.log('📊 Updating heatmap visualization for type:', heatmapType, 'Points:', data?.points.length);

    if (!data || !data.points || data.points.length === 0) {
      // Clear heatmap if no data
      heatmapInstanceRef.current.setData({
        max: 1,
        data: [],
      });
      return;
    }

    // Update heatmap with new data
    heatmapInstanceRef.current.setData({
      max: data.max || 1,
      data: data.points,
    });
  }, [heatmapType, heatmapData]);

  const hasData = heatmapData && heatmapData[heatmapType]?.points?.length > 0;

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-medium text-[#fafafa]">
            {stepName} - {heatmapType.charAt(0).toUpperCase() + heatmapType.slice(1)} Heatmap
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIframe(!showIframe)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              showIframe
                ? 'bg-[#7c5cff] text-white'
                : 'bg-[#111111] text-[#666666] hover:text-[#888888]'
            }`}
          >
            {showIframe ? 'Hide' : 'Show'} Page
          </button>
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="p-6">
        <div className="relative bg-[#111111] rounded-xl overflow-hidden border border-[#2a2a2a]" style={{ height: '600px' }}>
          {/* Page Preview (Iframe or placeholder) */}
          {showIframe && pageUrl && (
            <iframe
              ref={iframeRef}
              src={pageUrl}
              onLoad={() => setIframeLoaded(true)}
              className="absolute inset-0 w-full h-full z-0"
              style={{ pointerEvents: 'none' }}
              sandbox="allow-same-origin"
            />
          )}

          {/* Heatmap Layer */}
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full z-10"
            style={{ pointerEvents: 'none' }}
          />

          {/* No Data Overlay */}
          {!isLoading && !hasData && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#111111]/90">
              <div className="text-center">
                <MousePointerClick className="w-16 h-16 text-[#7c5cff] mx-auto mb-4 opacity-50" />
                <p className="text-[16px] text-[#888888] mb-2">
                  No {heatmapType} data available yet
                </p>
                <p className="text-[14px] text-[#666666]">
                  Data will appear as users interact with: {stepName}
                </p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
              <div className="flex items-center gap-3 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                <span className="text-[14px]">Loading heatmap data...</span>
              </div>
            </div>
          )}

          {/* CORS Warning */}
          {showIframe && pageUrl && !iframeLoaded && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-3">
              <p className="text-[12px] text-[#f59e0b]">
                ⚠️ Page preview may not load due to CORS restrictions. The heatmap will still work.
              </p>
            </div>
          )}
        </div>

        {/* Legend & Stats */}
        {hasData && (
          <div className="mt-4 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[#666666]">Intensity:</span>
              <div className="flex items-center gap-2">
                <div className="w-40 h-4 rounded-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500" />
                <span className="text-[11px] text-[#888888]">Low → High</span>
              </div>
            </div>
            <div className="text-[11px] text-[#666666]">
              {heatmapData[heatmapType]?.points.length || 0} data points
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {stats && hasData && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-[#111111] rounded-xl p-3">
              <div className="text-[11px] text-[#666666] mb-1">Total Clicks</div>
              <div className="text-[16px] font-semibold text-[#fafafa]">{stats.totalClicks}</div>
            </div>
            <div className="bg-[#111111] rounded-xl p-3">
              <div className="text-[11px] text-[#666666] mb-1">Mouse Movements</div>
              <div className="text-[16px] font-semibold text-[#fafafa]">{stats.totalMovements}</div>
            </div>
            <div className="bg-[#111111] rounded-xl p-3">
              <div className="text-[11px] text-[#666666] mb-1">Scroll Events</div>
              <div className="text-[16px] font-semibold text-[#fafafa]">{stats.totalScrolls}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
