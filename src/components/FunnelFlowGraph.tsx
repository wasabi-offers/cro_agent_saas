"use client";

import { useMemo, useState } from "react";
import { TrendingDown, GitBranch, GitMerge, LogIn, LogOut, X, ExternalLink, FileSearch, Users, Percent } from "lucide-react";

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
  url?: string;
  conversionRate?: number;  // From API: % passing to next page(s) with path attribution
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
  onAnalyzePage?: (stepIndex: number) => void;
}

function shouldUseScripts(label: string, url?: string): boolean {
  // Replit e concealedqualify: SPA che necessitano JS per renderizzare - scripts=1
  // (prima scripts=0 causava anteprime vuote per quiz/approval/apply/success)
  const s = (label + ' ' + (url || '')).toLowerCase();
  if (/replit\.com|replit\.dev|repl\.co|concealedqualify\.com/i.test(url || '')) return true;
  if (/quiz|checkout|payment|approval|apply|success|landing|optin/i.test(s)) return true;
  return true; // default: SPA moderne necessitano JS
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

export default function FunnelFlowGraph({ steps, connections, firstStep, getDropoffColor, updateTrigger, onAnalyzePage }: FunnelFlowGraphProps) {
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

  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);

  if (!steps || steps.length === 0) return null;

  // Layout constants
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 120;
  const LEVEL_GAP = 80;
  const LANE_GAP = 24;
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
    <div className="overflow-x-auto overflow-y-auto relative" style={{ maxHeight: '700px' }}>
      <div className="relative" style={{ width: Math.max(totalWidth, 600), height: Math.max(totalHeight, 300), minWidth: '100%' }}>
        {/* SVG connections - DIETRO le card (z-index 0) - ordine corretto: prima linee, poi card sopra */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={Math.max(totalWidth, 600)}
          height={Math.max(totalHeight, 300)}
          style={{ zIndex: 0 }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="12" markerHeight="10" refX="12" refY="5" orient="auto">
              <polygon points="0 0, 12 5, 0 10" fill="#7c5cff" stroke="#7c5cff" strokeWidth="0.5" />
            </marker>
          </defs>
          {svgConnections.map((conn, idx) => {
            const srcPos = getNodePos(conn.source);
            const tgtPos = getNodePos(conn.target);
            // Start 4px after source card, end 14px before target card - arrows visible in the space between cards
            const x1 = srcPos.x + NODE_WIDTH + 4;
            const y1 = srcPos.y + NODE_HEIGHT / 2;
            const x2 = tgtPos.x - 14;
            const y2 = tgtPos.y + NODE_HEIGHT / 2;

            const srcVisitors = conn.source.step.visitors;
            const tgtVisitors = conn.target.step.visitors;
            const dropPercent = srcVisitors > 0 ? Math.round(((srcVisitors - tgtVisitors) / srcVisitors) * 100) : 0;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const dx = x2 - x1;
            const cp1x = x1 + dx * 0.4;
            const cp2x = x1 + dx * 0.6;
            const dropY = midY + 8;

            return (
              <g key={idx}>
                <path
                  d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#7c5cff"
                  strokeWidth="3"
                  strokeOpacity="0.9"
                  markerEnd="url(#arrowhead)"
                />
                {srcVisitors > 0 && tgtVisitors > 0 && dropPercent > 0 && (
                  <>
                    <rect x={midX - 26} y={dropY} width={52} height={20} rx={6}
                      fill="#0a0a0a"
                      stroke={dropPercent > 50 ? '#ff6b6b' : dropPercent > 20 ? '#f59e0b' : '#00d4aa'}
                      strokeWidth="1.5" strokeOpacity="0.8"
                    />
                    <text x={midX} y={dropY + 10} textAnchor="middle" dominantBaseline="middle"
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

        {/* Node cards - ABOVE connections (z-index 1) */}
        {layout.nodes.map((node) => {
          const pos = getNodePos(node);

          return (
            <div
              key={`${node.id}-${updateTrigger}`}
              className="absolute cursor-pointer"
              style={{
                left: pos.x,
                top: pos.y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                zIndex: 1,
              }}
              onClick={() => setSelectedNode(node)}
            >
              <div className={`relative h-full rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:border-[#7c5cff]/60 ${
                node.isExit
                  ? 'border-[#00d4aa]/40 hover:shadow-[#00d4aa]/10'
                  : node.isEntry
                  ? 'border-[#7c5cff]/50 hover:shadow-[#7c5cff]/10'
                  : 'border-[#2a2a2a] hover:border-[#7c5cff]/30'
              } bg-[#f8f9fa]`}>

                <div className="relative z-10 flex flex-col h-full bg-[#f8f9fa]">
                  {/* Header: name + badges + visitors */}
                  <div className="p-3 pb-2 flex items-start justify-between gap-2 border-b border-[#2a2a2a] flex-shrink-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1a1a1a] truncate">{node.step.name}</p>
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
                      <p className={`text-[16px] font-bold leading-tight ${node.isExit ? 'text-[#00d4aa]' : 'text-[#1a1a1a]'}`}>
                        {(node.step.visitors ?? 0).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-[#666666]">visitors</p>
                    </div>
                  </div>

                  {/* Footer: dropoff + connections */}
                  <div className="p-2.5 border-t border-[#2a2a2a] flex items-center justify-between gap-2 flex-shrink-0 bg-[#f8f9fa]">
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

      {/* Expanded card modal - all data */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setSelectedNode(null)}>
          <div
            className="bg-[#0a0a0a] border-2 border-[#7c5cff] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-1">
                  {selectedNode.step.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {selectedNode.isEntry && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#7c5cff]/20 border border-[#7c5cff]/30 text-[9px] font-medium text-[#7c5cff]">
                      <LogIn className="w-3 h-3" /> ENTRY
                    </span>
                  )}
                  {selectedNode.isMerge && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#ffa500]/20 border border-[#ffa500]/30 text-[9px] font-medium text-[#ffa500]">
                      <GitMerge className="w-3 h-3" /> MERGE
                    </span>
                  )}
                  {selectedNode.isBranch && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#00d4aa]/20 border border-[#00d4aa]/30 text-[9px] font-medium text-[#00d4aa]">
                      <GitBranch className="w-3 h-3" /> BRANCH
                    </span>
                  )}
                  {selectedNode.isExit && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#00d4aa]/20 border border-[#00d4aa]/30 text-[9px] font-medium text-[#00d4aa]">
                      <LogOut className="w-3 h-3" /> EXIT
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f3f5] text-[#888888] hover:text-[#1a1a1a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#7c5cff]" />
                  <span className="text-[12px] text-[#888888]">Visitors</span>
                </div>
                <p className="text-[24px] font-bold text-[#1a1a1a]">
                  {selectedNode.step.visitors.toLocaleString()}
                </p>
              </div>

              <div className="bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-[#00d4aa]" />
                  <span className="text-[12px] text-[#888888]">Conversion Rate</span>
                </div>
                <p className="text-[24px] font-bold text-[#1a1a1a]">
                  {(() => {
                    if (selectedNode.step.conversionRate != null && Number.isFinite(selectedNode.step.conversionRate)) {
                      return selectedNode.step.conversionRate.toFixed(1);
                    }
                    const stepVisitors = selectedNode.step.visitors ?? 0;
                    const nextIndices = connections.length > 0
                      ? connections
                          .filter((c) => parseInt(c.source.replace('step-', ''), 10) - 1 === selectedNode.index)
                          .map((c) => parseInt(c.target.replace('step-', ''), 10) - 1)
                      : selectedNode.index + 1 < steps.length ? [selectedNode.index + 1] : [];
                    const nextVisitors = nextIndices.reduce((s, j) => s + (steps[j]?.visitors ?? 0), 0);
                    const rate = stepVisitors > 0 ? (nextVisitors / stepVisitors) * 100 : 0;
                    return Number.isFinite(rate) ? rate.toFixed(1) : '0';
                  })()}%
                </p>
                <p className="text-[11px] text-[#666666] mt-1">% passing to next page(s)</p>
              </div>

              {selectedNode.step.dropoff > 0 && (
                <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-[#ff6b6b]" />
                    <span className="text-[12px] text-[#888888]">Drop-off</span>
                  </div>
                  <p className="text-[24px] font-bold text-[#1a1a1a]">
                    {selectedNode.step.dropoff}%
                  </p>
                  <p className="text-[11px] text-[#888888] mt-2">
                    {Math.round(selectedNode.step.visitors * (selectedNode.step.dropoff / 100)).toLocaleString()} visitors lost
                  </p>
                </div>
              )}

              <div className="bg-[#2a2a2a] rounded-lg p-3">
                <span className="text-[11px] text-[#666666]">Flow: </span>
                {selectedNode.sourceNames.length > 0 && (
                  <span className="text-[11px] text-[#888888]">← {selectedNode.sourceNames.join(', ')}</span>
                )}
                {selectedNode.sourceNames.length > 0 && selectedNode.targetNames.length > 0 && (
                  <span className="text-[#555555]"> • </span>
                )}
                {selectedNode.targetNames.length > 0 && (
                  <span className="text-[11px] text-[#888888]">→ {selectedNode.targetNames.join(', ')}</span>
                )}
              </div>

              {selectedNode.step.url && (
                <div className="bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-[#7c5cff]" />
                    <span className="text-[12px] text-[#888888]">URL</span>
                  </div>
                  <a
                    href={selectedNode.step.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#7c5cff] hover:text-[#00d4aa] break-all line-clamp-2 block"
                  >
                    {selectedNode.step.url}
                  </a>
                </div>
              )}

              {/* Page Preview */}
              {selectedNode.step.url && (
                <div className="relative rounded-lg overflow-hidden border border-[#333] bg-[#1a1a1a]" style={{ height: 180 }}>
                  <iframe
                    src={`/api/proxy-page?url=${encodeURIComponent(selectedNode.step.url)}&scripts=${shouldUseScripts(selectedNode.step.name, selectedNode.step.url) ? '1' : '0'}`}
                    title={`Preview: ${selectedNode.step.name}`}
                    referrerPolicy="no-referrer"
                    className="absolute top-0 left-0 border-0 pointer-events-none"
                    style={{
                      width: '1280px',
                      height: '800px',
                      transform: 'scale(0.22)',
                      transformOrigin: 'top left',
                    }}
                    sandbox="allow-same-origin allow-scripts"
                    allow="autoplay"
                    loading="lazy"
                    tabIndex={-1}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              {onAnalyzePage && selectedNode.step.url && (
                <button
                  onClick={() => {
                    onAnalyzePage(selectedNode.index);
                    setSelectedNode(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c5cff] hover:bg-[#6b4ce6] text-white text-[13px] font-medium rounded-lg transition-colors"
                >
                  <FileSearch className="w-4 h-4" />
                  Page Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
