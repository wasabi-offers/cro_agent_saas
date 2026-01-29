"use client";

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Users, TrendingDown, Percent, X, ExternalLink, FileSearch } from 'lucide-react';

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
  url?: string;
  x?: number;  // Visual position X coordinate
  y?: number;  // Visual position Y coordinate
}

interface FunnelConnection {
  source: string;  // Node ID (e.g., "step-1")
  target: string;  // Node ID (e.g., "step-2")
}

interface FunnelVisualizerProps {
  steps: FunnelStep[];
  name: string;
  connections?: FunnelConnection[];  // Optional connections from database
  onAnalyzePage?: (stepIndex: number) => void;  // Callback when user clicks "Analisi pagina"
}

interface StepData {
  label: string;
  visitors: number;
  dropoff: number;
  conversionRate: number;
  url?: string;
}

function StepNode({ data }: { data: StepData }) {
  const hasPreview = !!data.url && !data.url.includes('clickbank.net');

  return (
    <div className="relative">
      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-[#7c5cff] border-2 border-white"
        style={{ left: -8 }}
      />

      <div className="bg-[#0a0a0a] border-2 border-[#7c5cff] rounded-xl overflow-hidden shadow-lg hover:border-[#00d4aa] transition-all cursor-pointer" style={{ width: 280 }}>
        {/* Header */}
        <div className="p-3 pb-2">
          <h3 className="text-[13px] font-semibold text-[#fafafa] mb-1.5 truncate">
            {data.label}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-[#888888]">
              <Users className="w-3 h-3 text-[#7c5cff]" />
              <span>{data.visitors.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#888888]">
              <Percent className="w-3 h-3 text-[#00d4aa]" />
              <span>{data.conversionRate.toFixed(1)}%</span>
            </div>
            {data.dropoff > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[#ff6b6b]">
                <TrendingDown className="w-3 h-3" />
                <span>{data.dropoff.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Page Preview */}
        <div className="relative bg-[#1a1a1a] border-t border-[#2a2a2a]" style={{ height: 160 }}>
          {hasPreview ? (
            <>
              <iframe
                src={`/api/proxy-page?url=${encodeURIComponent(data.url!)}`}
                title={`Preview: ${data.label}`}
                className="absolute top-0 left-0 border-0 pointer-events-none"
                style={{
                  width: '1280px',
                  height: '800px',
                  transform: 'scale(0.22)',
                  transformOrigin: 'top left',
                }}
                sandbox="allow-same-origin"
                loading="lazy"
                tabIndex={-1}
              />
              <div className="absolute inset-0" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[10px] text-[#444444]">Anteprima non disponibile</p>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-[#00d4aa] border-2 border-white"
        style={{ right: -8 }}
      />
    </div>
  );
}

const nodeTypes = {
  stepNode: StepNode,
};

// Componente interno con accesso a ReactFlow
function FunnelVisualizerInner({ steps, name, connections, onAnalyzePage }: FunnelVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { fitView } = useReactFlow();

  // VALIDAZIONE: Verifica che ci siano step
  if (!steps || steps.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-[#ff6b6b] text-[16px]">⚠️ Errore: Nessuno step trovato nel funnel</p>
        <p className="text-[#888888] text-[13px] mt-2">Controlla che il funnel sia stato creato correttamente</p>
      </div>
    );
  }

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Inizializza nodes ed edges quando cambiano gli steps (COPIATO DA FunnelBuilder)
  useEffect(() => {
    // Create nodes - IDs DEVONO INIZIARE DA 1 (come FunnelBuilder) !!!
    const newNodes: Node[] = steps.map((step, index) => {
      const conversionRate = index === 0
        ? 100
        : ((step.visitors / steps[0].visitors) * 100);

      return {
        id: `step-${index + 1}`,  // ← FIX CRITICO: era step-${index}
        type: 'stepNode',
        position: {
          x: step.x !== undefined ? step.x : index * 300,  // Use saved position or default
          y: step.y !== undefined ? step.y : 100            // Use saved position or default
        },
        data: {
          label: step.name,
          visitors: step.visitors,
          dropoff: step.dropoff,
          conversionRate,
          url: step.url,
        },
      };
    });

    // Create edges - use connections from database if available, otherwise generate linear flow
    if (connections && connections.length > 0) {
      console.warn('✅✅✅ Using CUSTOM connections from database! Count:', connections.length);
      console.warn('✅✅✅ Connections:', JSON.stringify(connections));
    } else {
      console.warn('⚠️⚠️⚠️ NO connections found! Using LINEAR fallback!');
    }

    const newEdges: Edge[] = connections && connections.length > 0
      ? // Use connections from database
        connections.map((conn, index) => ({
          id: `edge-${index}`,
          source: conn.source,
          target: conn.target,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#7c5cff',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#7c5cff',
            width: 20,
            height: 20,
          },
          label: '→',
          labelStyle: {
            fill: '#00d4aa',
            fontSize: 14,
            fontWeight: 700,
          },
          labelBgStyle: {
            fill: '#0a0a0a',
            fillOpacity: 0.8,
          },
        }))
      : // Generate linear flow (fallback for old funnels without connections)
        steps.slice(0, -1).map((_, index) => ({
          id: `edge-${index}`,
          source: `step-${index + 1}`,
          target: `step-${index + 2}`,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#7c5cff',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#7c5cff',
            width: 20,
            height: 20,
          },
          label: '→',
          labelStyle: {
            fill: '#00d4aa',
            fontSize: 14,
            fontWeight: 700,
          },
          labelBgStyle: {
            fill: '#0a0a0a',
            fillOpacity: 0.8,
          },
        }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [steps, connections, setNodes, setEdges]);

  // FitView automatico quando i nodi cambiano
  useEffect(() => {
    if (nodes.length > 0) {
      // Usa setTimeout per dare tempo a ReactFlow di renderizzare
      setTimeout(() => {
        fitView({
          padding: 0.3,
          includeHiddenNodes: false,
          duration: 400
        });
      }, 100);
    }
  }, [nodes, fitView]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const closeDetails = () => {
    setSelectedNode(null);
  };

  return (
    <div className="relative">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-[18px] font-semibold text-[#fafafa]">
            Funnel Flow: {name}
          </h2>
          <p className="text-[13px] text-[#888888] mt-1">
            Click on any step to view detailed metrics
          </p>
        </div>
        <div style={{ width: '100%', height: '500px' }} className="relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.3}
            maxZoom={1.5}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#7c5cff', strokeWidth: 3 },
            }}
            elementsSelectable={true}
            nodesConnectable={false}
            nodesDraggable={false}
            edgesFocusable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#333" gap={16} />
            <Controls className="bg-[#0a0a0a] border border-white/10 rounded-lg" />
          </ReactFlow>
        </div>
      </div>

      {/* Details Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-[#0a0a0a] border border-[#7c5cff] rounded-xl p-6 w-80 shadow-2xl z-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-[#fafafa] mb-1">
                Step Details
              </h3>
              <p className="text-[14px] text-[#888888]">
                {selectedNode.data.label}
              </p>
            </div>
            <button
              onClick={closeDetails}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-[#888888] hover:text-[#fafafa] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#7c5cff]" />
                <span className="text-[12px] text-[#888888]">Total Visitors</span>
              </div>
              <p className="text-[24px] font-bold text-[#fafafa]">
                {selectedNode.data.visitors.toLocaleString()}
              </p>
            </div>

            <div className="bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-[#00d4aa]" />
                <span className="text-[12px] text-[#888888]">Conversion Rate</span>
              </div>
              <p className="text-[24px] font-bold text-[#fafafa]">
                {selectedNode.data.conversionRate.toFixed(1)}%
              </p>
            </div>

            {selectedNode.data.dropoff > 0 && (
              <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-[#ff6b6b]" />
                  <span className="text-[12px] text-[#888888]">Drop-off Rate</span>
                </div>
                <p className="text-[24px] font-bold text-[#fafafa]">
                  {selectedNode.data.dropoff.toFixed(1)}%
                </p>
                <p className="text-[11px] text-[#888888] mt-2">
                  {Math.round(selectedNode.data.visitors * (selectedNode.data.dropoff / 100)).toLocaleString()} visitors left at this stage
                </p>
              </div>
            )}

            {selectedNode.data.url && (
              <div className="bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-[#7c5cff]" />
                  <span className="text-[12px] text-[#888888]">URL</span>
                </div>
                <a
                  href={selectedNode.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#7c5cff] hover:text-[#00d4aa] break-all line-clamp-2 block"
                >
                  {selectedNode.data.url}
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            {onAnalyzePage && selectedNode.data.url && (
              <button
                onClick={() => {
                  const stepIndex = parseInt(selectedNode.id.replace('step-', ''), 10) - 1;
                  onAnalyzePage(stepIndex);
                  closeDetails();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c5cff] hover:bg-[#6b4ce6] text-white text-[13px] font-medium rounded-lg transition-colors"
              >
                <FileSearch className="w-4 h-4" />
                Analisi pagina
              </button>
            )}
            <p className="text-[11px] text-[#666666]">
              Click on other steps to compare metrics
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente wrapper con ReactFlowProvider
export default function FunnelVisualizer(props: FunnelVisualizerProps) {
  return (
    <ReactFlowProvider>
      <FunnelVisualizerInner {...props} />
    </ReactFlowProvider>
  );
}
