"use client";

import { useState } from "react";
import { Play, Pause, SkipForward, SkipBack, MousePointerClick, Eye, Calendar } from "lucide-react";

interface SessionEvent {
  timestamp: number; // seconds from start
  type: "click" | "scroll" | "pageview" | "rage_click" | "dead_click";
  element?: string;
  page?: string;
  x?: number;
  y?: number;
}

interface Session {
  id: string;
  userId: string;
  startTime: string;
  duration: number; // seconds
  device: "desktop" | "mobile" | "tablet";
  pageViews: number;
  clicks: number;
  converted: boolean;
  events: SessionEvent[];
}

interface SessionReplayTimelineProps {
  session?: Session;
}

export default function SessionReplayTimeline({ session }: SessionReplayTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Mock session data
  const defaultSession: Session = {
    id: "sess_abc123",
    userId: "user_456",
    startTime: "2026-01-08T14:30:25",
    duration: 245,
    device: "desktop",
    pageViews: 5,
    clicks: 18,
    converted: true,
    events: [
      { timestamp: 0, type: "pageview", page: "/" },
      { timestamp: 5, type: "scroll" },
      { timestamp: 12, type: "click", element: "Hero CTA Button", x: 50, y: 35 },
      { timestamp: 18, type: "pageview", page: "/pricing" },
      { timestamp: 25, type: "scroll" },
      { timestamp: 32, type: "click", element: "Pricing Card - Pro", x: 40, y: 55 },
      { timestamp: 45, type: "dead_click", element: "Disabled Feature Toggle", x: 60, y: 48 },
      { timestamp: 52, type: "rage_click", element: "Unresponsive Submit Button", x: 50, y: 75 },
      { timestamp: 58, type: "rage_click", element: "Unresponsive Submit Button", x: 50, y: 75 },
      { timestamp: 62, type: "rage_click", element: "Unresponsive Submit Button", x: 50, y: 75 },
      { timestamp: 70, type: "pageview", page: "/checkout" },
      { timestamp: 85, type: "click", element: "Email Input", x: 45, y: 40 },
      { timestamp: 120, type: "click", element: "Continue Button", x: 50, y: 70 },
      { timestamp: 145, type: "scroll" },
      { timestamp: 162, type: "click", element: "Payment Method - Card", x: 35, y: 55 },
      { timestamp: 198, type: "click", element: "Complete Purchase", x: 50, y: 85 },
      { timestamp: 210, type: "pageview", page: "/confirmation" },
      { timestamp: 230, type: "scroll" },
    ],
  };

  const displaySession = session || defaultSession;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: SessionEvent["type"]) => {
    switch (type) {
      case "click":
        return <MousePointerClick className="w-3.5 h-3.5 text-[#7c5cff]" />;
      case "scroll":
        return <Eye className="w-3.5 h-3.5 text-[#00d4aa]" />;
      case "pageview":
        return <Calendar className="w-3.5 h-3.5 text-[#f59e0b]" />;
      case "rage_click":
        return <MousePointerClick className="w-3.5 h-3.5 text-[#ff6b6b]" />;
      case "dead_click":
        return <MousePointerClick className="w-3.5 h-3.5 text-[#f59e0b]" />;
    }
  };

  const getEventColor = (type: SessionEvent["type"]) => {
    switch (type) {
      case "click":
        return "bg-[#7c5cff]/20 border-[#7c5cff]/30 text-[#7c5cff]";
      case "scroll":
        return "bg-[#00d4aa]/20 border-[#00d4aa]/30 text-[#00d4aa]";
      case "pageview":
        return "bg-[#f59e0b]/20 border-[#f59e0b]/30 text-[#f59e0b]";
      case "rage_click":
        return "bg-[#ff6b6b]/20 border-[#ff6b6b]/30 text-[#ff6b6b]";
      case "dead_click":
        return "bg-[#f59e0b]/20 border-[#f59e0b]/30 text-[#f59e0b]";
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">
              Session Replay
            </h3>
            <p className="text-[13px] text-[#888888]">
              Session {displaySession.id} • {new Date(displaySession.startTime).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-[#666666] uppercase">Device</div>
              <div className="text-[13px] text-[#fafafa] font-medium capitalize">
                {displaySession.device}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#666666] uppercase">Duration</div>
              <div className="text-[13px] text-[#fafafa] font-medium">
                {formatTime(displaySession.duration)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#666666] uppercase">Converted</div>
              <div className={`text-[13px] font-medium ${displaySession.converted ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
                {displaySession.converted ? 'Yes ✓' : 'No'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            className="p-2 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-all"
          >
            <SkipBack className="w-4 h-4 text-[#fafafa]" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={() => setCurrentTime(Math.min(displaySession.duration, currentTime + 10))}
            className="p-2 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] transition-all"
          >
            <SkipForward className="w-4 h-4 text-[#fafafa]" />
          </button>

          {/* Timeline Slider */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-[13px] text-[#888888] font-mono">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative h-2 bg-[#111111] rounded-full">
              <input
                type="range"
                min="0"
                max={displaySession.duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="h-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-full transition-all"
                style={{ width: `${(currentTime / displaySession.duration) * 100}%` }}
              />
              {/* Event Markers */}
              {displaySession.events.map((event, idx) => (
                <div
                  key={idx}
                  className={`absolute top-0 w-1.5 h-2 rounded-full -translate-x-1/2 ${
                    event.type === 'rage_click' || event.type === 'dead_click'
                      ? 'bg-[#ff6b6b]'
                      : event.type === 'pageview'
                      ? 'bg-[#f59e0b]'
                      : 'bg-white/50'
                  }`}
                  style={{ left: `${(event.timestamp / displaySession.duration) * 100}%` }}
                />
              ))}
            </div>
            <span className="text-[13px] text-[#888888] font-mono">
              {formatTime(displaySession.duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="p-6">
        <h4 className="text-[14px] font-semibold text-[#fafafa] mb-4">
          Session Events
        </h4>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {displaySession.events.map((event, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                event.timestamp <= currentTime
                  ? getEventColor(event.type)
                  : 'bg-[#111111] border-[#2a2a2a] opacity-50'
              }`}
            >
              <div className="w-8 h-8 bg-[#0a0a0a] rounded-lg flex items-center justify-center flex-shrink-0">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[#fafafa] capitalize">
                    {event.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-[#666666] font-mono">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {event.element && (
                  <p className="text-[12px] text-[#888888]">
                    Element: {event.element}
                  </p>
                )}
                {event.page && (
                  <p className="text-[12px] text-[#888888]">
                    Page: {event.page}
                  </p>
                )}
                {(event.type === 'rage_click' || event.type === 'dead_click') && (
                  <p className="text-[11px] text-[#ff6b6b] mt-1">
                    ⚠️ User experienced frustration here
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
