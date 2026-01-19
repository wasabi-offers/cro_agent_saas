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
  landingId?: string;
  width?: number;
  height?: number;
}

export default function HeatmapVisualization({
  pageUrl,
  landingId,
  width = 1200,
  height = 800,
}: HeatmapVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmapInstanceRef = useRef<any>(null);
  const [heatmapType, setHeatmapType] = useState<"click" | "scroll" | "movement">("click");
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Record<string, HeatmapData> | null>(null);

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
      if (!landingId) {
        // Use demo data if no landing ID
        setHeatmapData(generateDemoHeatmapData());
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Replace with actual API call to fetch tracking data
        const response = await fetch(`/api/heatmap-data?landingId=${landingId}`);
        if (response.ok) {
          const data = await response.json();
          setHeatmapData(data);
        } else {
          // Fallback to demo data
          setHeatmapData(generateDemoHeatmapData());
        }
      } catch (error) {
        console.error("Error loading heatmap data:", error);
        setHeatmapData(generateDemoHeatmapData());
      } finally {
        setIsLoading(false);
      }
    }

    loadHeatmapData();
  }, [landingId]);

  // Update heatmap visualization when type or data changes
  useEffect(() => {
    if (!heatmapInstanceRef.current || !heatmapData) return;

    const data = heatmapData[heatmapType];
    if (!data) return;

    // Clear previous data
    heatmapInstanceRef.current.setData({
      max: data.max,
      data: data.points,
    });
  }, [heatmapType, heatmapData]);

  // Generate demo heatmap data
  function generateDemoHeatmapData(): Record<string, HeatmapData> {
    const clickPoints: HeatmapPoint[] = [];
    const scrollPoints: HeatmapPoint[] = [];
    const movementPoints: HeatmapPoint[] = [];

    // Generate demo click hotspots
    // Hero CTA
    for (let i = 0; i < 150; i++) {
      clickPoints.push({
        x: 600 + Math.random() * 100 - 50,
        y: 200 + Math.random() * 40 - 20,
        value: Math.random() * 50 + 50,
      });
    }

    // Navigation clicks
    for (let i = 0; i < 80; i++) {
      clickPoints.push({
        x: 200 + Math.random() * 800,
        y: 50 + Math.random() * 20,
        value: Math.random() * 30 + 20,
      });
    }

    // Footer clicks (scattered)
    for (let i = 0; i < 40; i++) {
      clickPoints.push({
        x: Math.random() * width,
        y: height - 100 + Math.random() * 80,
        value: Math.random() * 20 + 10,
      });
    }

    // Generate demo scroll depth (horizontal bars)
    for (let y = 0; y < height; y += 5) {
      const intensity = Math.max(0, 100 - (y / height) * 150); // Decreases with depth
      for (let i = 0; i < 50; i++) {
        scrollPoints.push({
          x: Math.random() * width,
          y: y + Math.random() * 10,
          value: intensity + Math.random() * 20,
        });
      }
    }

    // Generate demo mouse movement hotspots
    // Hero area
    for (let i = 0; i < 200; i++) {
      movementPoints.push({
        x: 400 + Math.random() * 400,
        y: 150 + Math.random() * 200,
        value: Math.random() * 40 + 30,
      });
    }

    // Pricing cards
    for (let i = 0; i < 150; i++) {
      movementPoints.push({
        x: 300 + Math.random() * 600,
        y: 400 + Math.random() * 150,
        value: Math.random() * 50 + 40,
      });
    }

    return {
      click: { type: "click", points: clickPoints, max: 100 },
      scroll: { type: "scroll", points: scrollPoints, max: 120 },
      movement: { type: "movement", points: movementPoints, max: 80 },
    };
  }

  const heatmapTypes = [
    {
      id: "click" as const,
      label: "Click Map",
      icon: MousePointerClick,
      description: "Where users click on your page",
    },
    {
      id: "scroll" as const,
      label: "Scroll Map",
      icon: ArrowDown,
      description: "How far users scroll down",
    },
    {
      id: "movement" as const,
      label: "Move Map",
      icon: MousePointer,
      description: "Mouse movement and attention",
    },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#fafafa]">
                Heatmap Visualization
              </h3>
              <p className="text-[13px] text-[#888888] mt-0.5">
                Real user interaction data overlay
              </p>
            </div>
          </div>
        </div>

        {/* Heatmap Type Selector */}
        <div className="flex gap-3">
          {heatmapTypes.map((type) => {
            const Icon = type.icon;
            const isActive = heatmapType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setHeatmapType(type.id)}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#7c5cff] text-white"
                    : "bg-[#111111] text-[#888888] hover:bg-[#1a1a1a] hover:text-[#fafafa]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-[14px] font-medium">{type.label}</div>
                  <div className={`text-[11px] ${isActive ? "text-white/70" : "text-[#666666]"}`}>
                    {type.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Heatmap Container */}
      <div className="p-6">
        <div className="relative bg-[#111111] rounded-xl overflow-hidden border border-[#2a2a2a]">
          {/* Background: Landing Page Preview */}
          <div
            className="absolute inset-0 opacity-50"
            style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
          >
            <iframe
              src={pageUrl}
              className="w-full h-full"
              title="Landing Page Preview"
              sandbox="allow-same-origin allow-scripts"
              style={{ pointerEvents: "none" }}
            />
          </div>

          {/* Heatmap Layer */}
          <div
            ref={containerRef}
            className="relative z-10"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              maxWidth: "100%",
            }}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="flex items-center gap-3 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                <span className="text-[14px]">Loading heatmap data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[#666666]">Intensity:</span>
            <div className="flex items-center gap-2">
              <div className="w-40 h-4 rounded-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500" />
              <span className="text-[11px] text-[#888888]">Low → High</span>
            </div>
          </div>
          <div className="text-[11px] text-[#666666]">
            {heatmapData?.[heatmapType]?.points.length || 0} data points
          </div>
        </div>
      </div>
    </div>
  );
}
