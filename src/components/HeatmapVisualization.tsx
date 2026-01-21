"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointerClick, AlertCircle } from "lucide-react";

// Import heatmap.js
// @ts-ignore
import h337 from "heatmap.js";

interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}

interface HeatmapData {
  type: "click" | "scroll" | "movement";
  points: HeatmapPoint[];
  max: number;
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
  const [showPage, setShowPage] = useState(true);
  const [contentHeight, setContentHeight] = useState(2000);
  const [isDemoData, setIsDemoData] = useState(false);

  // Detect iframe content height
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          const height = Math.max(
            iframeDocument.body.scrollHeight,
            iframeDocument.documentElement.scrollHeight,
            3000 // minimum height
          );
          console.log('📏 Detected iframe content height:', height);
          setContentHeight(height);
        }
      } catch (error) {
        // CORS error - can't access iframe content
        console.log('⚠️ Cannot detect iframe height (CORS), using default 3000px');
        setContentHeight(3000);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [pageUrl]);

  // Initialize heatmap.js
  useEffect(() => {
    if (!containerRef.current || heatmapInstanceRef.current) return;

    const heatmapInstance = h337.create({
      container: containerRef.current,
      radius: 40,
      maxOpacity: 0.6,
      minOpacity: 0.1,
      blur: 0.75,
      gradient: {
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
        heatmapInstanceRef.current = null;
      }
    };
  }, []);

  // Load heatmap data
  useEffect(() => {
    async function loadHeatmapData() {
      setIsLoading(true);
      try {
        const url = `/api/heatmap-data?funnelId=${funnelId}&stepName=${encodeURIComponent(stepName)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setHeatmapData({
            click: data.click,
            scroll: data.scroll,
            movement: data.movement,
          });
          setStats(data.stats);
          // Check if data is demo
          setIsDemoData(data.source === 'demo');
        } else {
          setHeatmapData(null);
          setIsDemoData(false);
        }
      } catch (error) {
        console.error("Error loading heatmap data:", error);
        setHeatmapData(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadHeatmapData();
  }, [funnelId, stepName]);

  // Update heatmap visualization with coordinate scaling
  useEffect(() => {
    if (!heatmapInstanceRef.current || !heatmapData || !containerRef.current) return;

    const data = heatmapData[heatmapType];

    if (!data || !data.points || data.points.length === 0) {
      heatmapInstanceRef.current.setData({
        max: 1,
        data: [],
      });
      return;
    }

    // Get actual container dimensions
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // Assume original coordinates were captured on standard viewport (1920x1080)
    const ORIGINAL_WIDTH = 1920;
    const ORIGINAL_HEIGHT = 1080;

    // Scale coordinates to match current container size
    const scaleX = containerWidth / ORIGINAL_WIDTH;
    const scaleY = containerHeight / ORIGINAL_HEIGHT;

    console.log('📐 Heatmap scaling:', {
      containerWidth,
      containerHeight,
      scaleX: scaleX.toFixed(3),
      scaleY: scaleY.toFixed(3),
      originalPoints: data.points.length,
    });

    // Scale all points
    const scaledPoints = data.points.map(point => ({
      x: Math.round(point.x * scaleX),
      y: Math.round(point.y * scaleY),
      value: point.value,
    }));

    heatmapInstanceRef.current.setData({
      max: data.max || 1,
      data: scaledPoints,
    });
  }, [heatmapType, heatmapData, contentHeight]);

  const hasData = heatmapData && heatmapData[heatmapType]?.points?.length > 0;

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Demo Data Warning */}
      {isDemoData && (
        <div className="bg-gradient-to-r from-[#f59e0b] to-[#ef4444] p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-white">
              ⚠️ QUESTI SONO DEMO DATA - NON DATI REALI!
            </p>
            <p className="text-[12px] text-white/90 mt-1">
              Installa lo script di tracking dalla scheda "Setup" per vedere dati reali.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h3 className="text-[14px] font-medium text-[#fafafa]">
          {stepName} - {heatmapType.charAt(0).toUpperCase() + heatmapType.slice(1)} Heatmap
        </h3>
        <button
          onClick={() => setShowPage(!showPage)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
            showPage
              ? 'bg-[#7c5cff] text-white'
              : 'bg-[#111111] text-[#666666] hover:text-[#888888]'
          }`}
        >
          {showPage ? 'Hide' : 'Show'} Page
        </button>
      </div>

      {/* Heatmap Container - FULL WIDTH AND HEIGHT */}
      <div className="p-6">
        <div className="relative bg-[#111111] rounded-xl border border-[#2a2a2a]" style={{ width: '100%', height: 'auto', minHeight: '100vh' }}>
          {/* Full page wrapper */}
          <div className="relative w-full" style={{ height: 'auto', minHeight: '100vh' }}>
            {/* Page Iframe - FULL SIZE */}
            {showPage && pageUrl && (
              <iframe
                ref={iframeRef}
                src={pageUrl}
                className="w-full z-0"
                style={{
                  pointerEvents: 'none',
                  height: '200vh',
                  minHeight: '2000px',
                  border: 'none',
                  display: 'block',
                  transform: 'scale(1)',
                  transformOrigin: 'top left'
                }}
                sandbox="allow-same-origin allow-scripts"
              />
            )}

            {/* Heatmap Overlay - FULL SIZE */}
            <div
              ref={containerRef}
              className="absolute top-0 left-0 w-full z-10"
              style={{
                pointerEvents: 'none',
                height: '200vh',
                minHeight: '2000px'
              }}
            />

            {/* No Data Overlay */}
            {!isLoading && !hasData && (
              <div className="absolute top-0 left-0 w-full flex items-center justify-center z-20 bg-[#111111]/95" style={{ height: '100vh', minHeight: '600px' }}>
                <div className="text-center">
                  <MousePointerClick className="w-16 h-16 text-[#7c5cff] mx-auto mb-4 opacity-50" />
                  <p className="text-[16px] text-[#fafafa] font-semibold mb-2">
                    NESSUN DATO REALE DISPONIBILE
                  </p>
                  <p className="text-[14px] text-[#888888]">
                    Installa lo script di tracking dalla scheda "Setup" su: {stepName}
                  </p>
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="absolute top-0 left-0 w-full bg-black/80 flex items-center justify-center z-20" style={{ height: '100vh', minHeight: '600px' }}>
                <div className="flex items-center gap-3 text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  <span className="text-[14px]">Loading heatmap data...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend & Stats */}
        {hasData && (
          <>
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

            {stats && (
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
          </>
        )}
      </div>
    </div>
  );
}
