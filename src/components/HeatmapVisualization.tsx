"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointerClick, AlertCircle, Monitor, Smartphone } from "lucide-react";

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
  const [contentHeight, setContentHeight] = useState(800);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  // Rileva altezza reale del contenuto della pagina nell'iframe
  // Il blocco heatmap si adatta alla pagina, NON il contrario
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setIframeLoaded(false);

    const detectHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          const h = Math.max(
            doc.body.scrollHeight || 0,
            doc.documentElement?.scrollHeight || 0,
            500
          );
          if (h > 100) {
            setContentHeight(h);
            setIframeLoaded(true);
          }
        }
      } catch {
        // CORS fallback - usa altezza ragionevole
        setIframeLoaded(true);
      }
    };

    const handleLoad = () => {
      // Prova subito
      detectHeight();
      // Riprova dopo per pagine SPA che renderizzano in ritardo
      setTimeout(detectHeight, 1000);
      setTimeout(detectHeight, 2500);
      setTimeout(detectHeight, 5000);
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [pageUrl, device]);

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
        const url = `/api/heatmap-data?funnelId=${funnelId}&stepName=${encodeURIComponent(stepName)}&device=${device}`;
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
  }, [funnelId, stepName, device]);

  // Update heatmap visualization with coordinate scaling
  // I click originali sono registrati con le coordinate del viewport dell'utente
  // Dobbiamo scalarli per combaciare con la dimensione attuale del container
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

    // Dimensioni attuali del container (deve corrispondere all'iframe)
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // Viewport di riferimento per i click originali
    // Mobile: 375px, Desktop: 1440px (valori standard)
    const originalViewportWidth = device === "mobile" ? 375 : 1440;

    // Scala X: rapporto tra container attuale e viewport originale dei click
    const scaleX = containerWidth / originalViewportWidth;
    // Scala Y: i click Y sono relativi alla pagina, il container ha la stessa altezza
    const scaleY = 1; // altezza 1:1 - il container si adatta alla pagina

    // Scala tutti i punti
    const scaledPoints = data.points
      .map(point => ({
        x: Math.round(point.x * scaleX),
        y: Math.round(point.y), // Y non va scalato, il container ha la stessa altezza della pagina
        value: point.value,
      }))
      .filter(p => p.x >= 0 && p.x <= containerWidth && p.y >= 0 && p.y <= containerHeight);

    heatmapInstanceRef.current.setData({
      max: data.max || 1,
      data: scaledPoints,
    });
  }, [heatmapType, heatmapData, contentHeight, device]);

  const hasData = heatmapData && heatmapData[heatmapType]?.points?.length > 0;

  // Viewport width: mobile = 375px, desktop = larghezza reale della pagina (nessun limite)
  const viewportWidth = device === "mobile" ? 375 : null;

  return (
    <div className="bg-white border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Demo Data Warning */}
      {isDemoData && (
        <div className="bg-gradient-to-r from-[#f59e0b] to-[#ef4444] p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-white">
              ⚠️ THESE ARE DEMO DATA - NOT REAL DATA!
            </p>
            <p className="text-[12px] text-white/90 mt-1">
              Install the tracking script from the "Setup" tab to see real data.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-b border-[#d0d0d0] flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[14px] font-medium text-[#1a1a1a]">
          {stepName} - {heatmapType.charAt(0).toUpperCase() + heatmapType.slice(1)} Heatmap
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#666666]">Device:</span>
          {[
            { id: "mobile" as const, label: "Mobile", icon: Smartphone },
            { id: "desktop" as const, label: "Desktop", icon: Monitor },
          ].map((d) => {
            const Icon = d.icon;
            const isActive = device === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isActive
                    ? "bg-[#7c5cff] text-white"
                    : "bg-[#f8f9fa] text-[#666666] hover:text-[#888888] border border-[#d0d0d0]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {d.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowPage(!showPage)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
            showPage
              ? 'bg-[#7c5cff] text-white'
              : 'bg-[#f8f9fa] text-[#666666] hover:text-[#888888]'
          }`}
        >
          {showPage ? 'Hide' : 'Show'} Page
        </button>
      </div>

      {/* Heatmap Container - il blocco si adatta alla pagina */}
      <div className="p-6">
        <div
          className="relative bg-[#f8f9fa] rounded-xl border border-[#d0d0d0] overflow-y-auto"
          style={{ width: "100%", maxHeight: "85vh" }}
        >
          {/* Wrapper centrato - la dimensione è dettata dalla pagina */}
          <div
            className="relative mx-auto"
            style={{
              width: viewportWidth ? `${viewportWidth}px` : "100%",
              minHeight: `${contentHeight}px`,
            }}
          >
            {/* Iframe nascosto grande per catturare tutta la pagina */}
            {pageUrl && (
              <iframe
                ref={iframeRef}
                src={`/api/proxy-page?url=${encodeURIComponent(pageUrl)}&scripts=1`}
                referrerPolicy="no-referrer"
                className="absolute top-0 left-0 block"
                style={{
                  pointerEvents: "none",
                  width: viewportWidth ? `${viewportWidth}px` : "100%",
                  height: `${contentHeight}px`,
                  border: "none",
                  zIndex: 0,
                  opacity: showPage ? 1 : 0,
                  visibility: showPage ? "visible" : "hidden",
                }}
                sandbox="allow-same-origin allow-scripts"
              />
            )}

            {/* Heatmap Overlay - stessa dimensione dell'iframe/pagina */}
            <div
              ref={containerRef}
              className="absolute top-0 left-0 bg-transparent"
              style={{
                pointerEvents: "none",
                width: viewportWidth ? `${viewportWidth}px` : "100%",
                height: `${contentHeight}px`,
                zIndex: 10,
              }}
            />

            {/* No Data Overlay */}
            {!isLoading && !hasData && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-20 bg-[#f8f9fa]/95">
                <div className="text-center">
                  <MousePointerClick className="w-16 h-16 text-[#7c5cff] mx-auto mb-4 opacity-50" />
                  <p className="text-[16px] text-[#1a1a1a] font-semibold mb-2">
                    NESSUN DATO REALE DISPONIBILE
                  </p>
                  <p className="text-[14px] text-[#888888]">
                    Install the tracking script from the "Setup" tab for: {stepName}
                  </p>
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="absolute top-0 left-0 w-full h-full bg-black/80 flex items-center justify-center z-20">
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
                <div className="bg-[#f8f9fa] rounded-xl p-3">
                  <div className="text-[11px] text-[#666666] mb-1">Total Clicks</div>
                  <div className="text-[16px] font-semibold text-[#1a1a1a]">{stats.totalClicks}</div>
                </div>
                <div className="bg-[#f8f9fa] rounded-xl p-3">
                  <div className="text-[11px] text-[#666666] mb-1">Mouse Movements</div>
                  <div className="text-[16px] font-semibold text-[#1a1a1a]">{stats.totalMovements}</div>
                </div>
                <div className="bg-[#f8f9fa] rounded-xl p-3">
                  <div className="text-[11px] text-[#666666] mb-1">Scroll Events</div>
                  <div className="text-[16px] font-semibold text-[#1a1a1a]">{stats.totalScrolls}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
