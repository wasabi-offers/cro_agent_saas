"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointer, MousePointerClick, Eye, ArrowDown, RefreshCw } from "lucide-react";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const heatmapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Record<string, HeatmapData> | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

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

  // Capture page screenshot
  const captureScreenshot = async () => {
    if (!pageUrl) return;

    setIsCapturingScreenshot(true);
    setScreenshotError(null);

    try {
      console.log('📸 Capturing screenshot for:', pageUrl);
      const response = await fetch(`/api/capture-screenshot?url=${encodeURIComponent(pageUrl)}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.image) {
          setScreenshot(data.image);
          console.log('✅ Screenshot captured successfully');
        } else {
          throw new Error(data.error || 'Failed to capture screenshot');
        }
      } else {
        throw new Error(`Screenshot API returned ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
      setScreenshotError(error instanceof Error ? error.message : 'Failed to capture screenshot');
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

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

  // Auto-capture screenshot on mount
  useEffect(() => {
    if (pageUrl && !screenshot) {
      captureScreenshot();
    }
  }, [pageUrl]);

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
            onClick={captureScreenshot}
            disabled={isCapturingScreenshot}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] text-[#888888] hover:text-[#fafafa] rounded-lg text-[12px] font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isCapturingScreenshot ? 'animate-spin' : ''}`} />
            {isCapturingScreenshot ? 'Capturing...' : 'Refresh Page'}
          </button>
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="p-6">
        <div
          ref={scrollContainerRef}
          className="relative bg-[#111111] rounded-xl overflow-auto border border-[#2a2a2a]"
          style={{ height: '600px' }}
        >
          {/* Screenshot Background */}
          {screenshot && (
            <img
              src={screenshot}
              alt="Page screenshot"
              className="relative w-full h-auto"
              style={{ minHeight: '100%', objectFit: 'contain' }}
            />
          )}

          {/* Heatmap Overlay */}
          <div
            ref={containerRef}
            className="absolute top-0 left-0 w-full h-full z-10"
            style={{ pointerEvents: 'none' }}
          />

          {/* No Screenshot Yet */}
          {!screenshot && !isCapturingScreenshot && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MousePointerClick className="w-16 h-16 text-[#7c5cff] mx-auto mb-4 opacity-50" />
                <p className="text-[16px] text-[#888888] mb-2">
                  Page screenshot not available
                </p>
                <button
                  onClick={captureScreenshot}
                  className="mt-4 px-4 py-2 bg-[#7c5cff] text-white rounded-lg text-[14px] font-medium hover:bg-[#6b4fee] transition-all"
                >
                  Capture Screenshot
                </button>
              </div>
            </div>
          )}

          {/* Screenshot Capturing */}
          {isCapturingScreenshot && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                <span className="text-[14px]">Capturing page screenshot...</span>
                <span className="text-[12px] text-[#666666]">This may take a few seconds</span>
              </div>
            </div>
          )}

          {/* No Data Overlay */}
          {screenshot && !isLoading && !hasData && (
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

          {/* Loading Heatmap Data */}
          {isLoading && screenshot && (
            <div className="absolute top-4 right-4 z-20 bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#7c5cff]" />
              <span className="text-[12px] text-[#888888]">Loading data...</span>
            </div>
          )}

          {/* Screenshot Error */}
          {screenshotError && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg p-3">
              <p className="text-[12px] text-[#ff6b6b]">
                ❌ {screenshotError}
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
