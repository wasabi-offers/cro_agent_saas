"use client";

import { useMemo } from "react";
import { Users, TrendingDown, GitBranch, GitMerge, LogIn, LogOut } from "lucide-react";

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
  url?: string;
}

interface FunnelConnection {
  source: string;
  target: string;
}

interface FunnelFlowGraphProps {
  steps: FunnelStep[];
  connections: FunnelConnection[];
  firstStep: FunnelStep;
  getDropoffColor: (dropoff: number) => string;
  updateTrigger: number;
}

interface LayoutNode {
  id: string;
  step: FunnelStep;
  index: number;
  level: number;
  laneIndex: number;
  laneCount: number;
  isEntry: boolean;
  isExit: boolean;
  isBranch: boolean;
  isMerge: boolean;
  sourceNames: string[];
  targetNames: string[];
}

export default function FunnelFlowGraph({ steps, connections, firstStep, getDropoffColor, updateTrigger }: FunnelFlowGraphProps) {
  const layout = useMemo(() => {
    if (!steps || steps.length === 0) return { nodes: [] as LayoutNode[], levels: 0, maxLane: 0 };

    const incoming = new Map<number, number[]>();
    const outgoing = new Map<number, number[]>();
    for (let i = 0; i < steps.length; i++) {
      incoming.set(i, []);
      outgoing.set(i, []);
    }

    for (const conn of connections) {
      const srcIdx = parseInt(conn.source.replace('step-', '')) - 1;
      const tgtIdx = parseInt(conn.target.replace('step-', '')) - 1;
      if (srcIdx >= 0 && srcIdx < steps.length && tgtIdx >= 0 && tgtIdx < steps.length) {
        outgoing.get(srcIdx)!.push(tgtIdx);
        incoming.get(tgtIdx)!.push(srcIdx);
      }
    }

    const levels = new Map<number, number>();
    const queue: number[] = [];
    for (let i = 0; i < steps.length; i++) {
      if (incoming.get(i)!.length === 0) {
        queue.push(i);
        levels.set(i, 0);
      }
    }

    const visited = new Set<number>();
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      const currLevel = levels.get(curr) || 0;
      for (const next of outgoing.get(curr)!) {
        const newLevel = currLevel + 1;
        if (!levels.has(next) || levels.get(next)! < newLevel) {
          levels.set(next, newLevel);
        }
        const allParentsVisited = incoming.get(next)!.every(p => visited.has(p));
        if (allParentsVisited) {
          queue.push(next);
        }
      }
    }

    for (let i = 0; i < steps.length; i++) {
      if (!levels.has(i)) levels.set(i, i);
    }

    const levelGroups = new Map<number, number[]>();
    for (let i = 0; i < steps.length; i++) {
      const lvl = levels.get(i)!;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(i);
    }

    const maxLevel = Math.max(...Array.from(levels.values()));
    let maxLane = 0;

    const nodes: LayoutNode[] = steps.map((step, index) => {
      const lvl = levels.get(index)!;
      const group = levelGroups.get(lvl)!;
      const laneIndex = group.indexOf(index);
      const laneCount = group.length;
      if (laneCount > maxLane) maxLane = laneCount;

      const inc = incoming.get(index)!;
      const out = outgoing.get(index)!;

      return {
        id: `step-${index + 1}`,
        step,
        index,
        level: lvl,
        laneIndex,
        laneCount,
        isEntry: inc.length === 0,
        isExit: out.length === 0,
        isBranch: out.length > 1,
        isMerge: inc.length > 1,
        sourceNames: inc.map(i => steps[i]?.name).filter(Boolean),
        targetNames: out.map(i => steps[i]?.name).filter(Boolean),
      };
    });

    return { nodes, levels: maxLevel + 1, maxLane };
  }, [steps, connections]);

  const svgConnections = useMemo(() => {
    if (connections.length === 0 || layout.nodes.length === 0) return [];
    return connections.map(conn => {
      const srcIdx = parseInt(conn.source.replace('step-', '')) - 1;
      const tgtIdx = parseInt(conn.target.replace('step-', '')) - 1;
      const srcNode = layout.nodes[srcIdx];
      const tgtNode = layout.nodes[tgtIdx];
      if (!srcNode || !tgtNode) return null;
      return { source: srcNode, target: tgtNode };
    }).filter(Boolean) as { source: LayoutNode; target: LayoutNode }[];
  }, [connections, layout.nodes]);

  if (!steps || steps.length === 0) return null;

  // Layout constants - bigger cards for preview
  const NODE_WIDTH = 300;
  const NODE_HEIGHT = 280;
  const LEVEL_GAP = 100;
  const LANE_GAP = 32;
  const PADDING = 32;

  const totalWidth = layout.levels * (NODE_WIDTH + LEVEL_GAP) - LEVEL_GAP + PADDING * 2;
  const totalHeight = layout.maxLane * (NODE_HEIGHT + LANE_GAP) - LANE_GAP + PADDING * 2;

  const getNodePos = (node: LayoutNode) => {
    const totalLaneHeight = node.laneCount * NODE_HEIGHT + (node.laneCount - 1) * LANE_GAP;
    const centerY = totalHeight / 2;
    const startY = centerY - totalLaneHeight / 2;
    return {
      x: PADDING + node.level * (NODE_WIDTH + LEVEL_GAP),
      y: startY + node.laneIndex * (NODE_HEIGHT + LANE_GAP),
    };
  };

  return (
    <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '700px' }}>
      <div className="relative" style={{ width: Math.max(totalWidth, 600), height: Math.max(totalHeight, 300), minWidth: '100%' }}>
        {/* SVG connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={Math.max(totalWidth, 600)}
          height={Math.max(totalHeight, 300)}
          style={{ zIndex: 0 }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
              <polygon points="0 0, 10 4, 0 8" fill="#7c5cff" />
            </marker>
          </defs>
          {svgConnections.map((conn, idx) => {
            const srcPos = getNodePos(conn.source);
            const tgtPos = getNodePos(conn.target);
            const x1 = srcPos.x + NODE_WIDTH;
            const y1 = srcPos.y + NODE_HEIGHT / 2;
            const x2 = tgtPos.x;
            const y2 = tgtPos.y + NODE_HEIGHT / 2;

            const srcVisitors = conn.source.step.visitors;
            const tgtVisitors = conn.target.step.visitors;
            const dropPercent = srcVisitors > 0 ? Math.round(((srcVisitors - tgtVisitors) / srcVisitors) * 100) : 0;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const dx = x2 - x1;
            const cp1x = x1 + dx * 0.4;
            const cp2x = x1 + dx * 0.6;

            return (
              <g key={idx}>
                <path
                  d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#7c5cff"
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  markerEnd="url(#arrowhead)"
                />
                {srcVisitors > 0 && tgtVisitors > 0 && dropPercent > 0 && (
                  <>
                    <rect x={midX - 24} y={midY - 10} width={48} height={20} rx={6}
                      fill="#0a0a0a"
                      stroke={dropPercent > 50 ? '#ff6b6b' : dropPercent > 20 ? '#f59e0b' : '#00d4aa'}
                      strokeWidth="1" strokeOpacity="0.5"
                    />
                    <text x={midX} y={midY + 4} textAnchor="middle"
                      fill={dropPercent > 50 ? '#ff6b6b' : dropPercent > 20 ? '#f59e0b' : '#00d4aa'}
                      fontSize="10" fontWeight="600"
                    >
                      -{dropPercent}%
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Node cards */}
        {layout.nodes.map((node) => {
          const pos = getNodePos(node);
          const hasUrl = !!node.step.url && !node.step.url.includes('clickbank.net');

          return (
            <div
              key={`${node.id}-${updateTrigger}`}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                zIndex: 1,
              }}
            >
              <div className={`relative h-full rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
                node.isExit
                  ? 'border-[#00d4aa]/40 hover:shadow-[#00d4aa]/10'
                  : node.isEntry
                  ? 'border-[#7c5cff]/50 hover:shadow-[#7c5cff]/10'
                  : 'border-[#2a2a2a] hover:border-[#7c5cff]/30'
              } bg-[#111111]`}>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Header: name + badges + visitors */}
                  <div className="p-3 pb-2 flex items-start justify-between gap-2 border-b border-[#2a2a2a]">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#fafafa] truncate">{node.step.name}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {node.isEntry && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#7c5cff]/20 border border-[#7c5cff]/30 text-[8px] font-medium text-[#7c5cff]">
                            <LogIn className="w-2.5 h-2.5" /> ENTRY
                          </span>
                        )}
                        {node.isMerge && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#ffa500]/20 border border-[#ffa500]/30 text-[8px] font-medium text-[#ffa500]">
                            <GitMerge className="w-2.5 h-2.5" /> MERGE
                          </span>
                        )}
                        {node.isBranch && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#00d4aa]/20 border border-[#00d4aa]/30 text-[8px] font-medium text-[#00d4aa]">
                            <GitBranch className="w-2.5 h-2.5" /> BRANCH
                          </span>
                        )}
                        {node.isExit && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#00d4aa]/20 border border-[#00d4aa]/30 text-[8px] font-medium text-[#00d4aa]">
                            <LogOut className="w-2.5 h-2.5" /> EXIT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[16px] font-bold leading-tight ${node.isExit ? 'text-[#00d4aa]' : 'text-[#fafafa]'}`}>
                        {node.step.visitors.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-[#666666]">visitors</p>
                    </div>
                  </div>

                  {/* Page Preview */}
                  <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                    {hasUrl ? (
                      <div className="w-full h-full relative">
                        <iframe
                          src={node.step.url}
                          title={`Preview: ${node.step.name}`}
                          className="absolute top-0 left-0 border-0 pointer-events-none"
                          style={{
                            width: '1280px',
                            height: '800px',
                            transform: 'scale(0.225)',
                            transformOrigin: 'top left',
                          }}
                          sandbox="allow-same-origin"
                          loading="lazy"
                          tabIndex={-1}
                        />
                        {/* Overlay to prevent interaction */}
                        <div className="absolute inset-0" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center mx-auto mb-1.5">
                            <Users className="w-4 h-4 text-[#444444]" />
                          </div>
                          <p className="text-[10px] text-[#444444]">Anteprima non disponibile</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: dropoff + connections */}
                  <div className="p-2.5 border-t border-[#2a2a2a] flex items-center justify-between gap-2">
                    <div className="text-[9px] text-[#555555] truncate">
                      {node.sourceNames.length > 0 && (
                        <span>← {node.sourceNames.length > 1 ? `${node.sourceNames.length} sources` : node.sourceNames[0]}</span>
                      )}
                      {node.sourceNames.length > 0 && node.targetNames.length > 0 && ' • '}
                      {node.targetNames.length > 0 && (
                        <span>→ {node.targetNames.length > 1 ? `${node.targetNames.length} targets` : node.targetNames[0]}</span>
                      )}
                    </div>
                    {!node.isEntry && node.step.dropoff > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <TrendingDown className={`w-3 h-3 ${getDropoffColor(node.step.dropoff)}`} />
                        <span className={`text-[10px] font-semibold ${getDropoffColor(node.step.dropoff)}`}>
                          {node.step.dropoff}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
