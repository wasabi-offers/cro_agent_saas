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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Users, TrendingDown, Percent, X } from 'lucide-react';

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
}

interface FunnelConnection {
  source: string;  // Node ID (e.g., "step-1")
  target: string;  // Node ID (e.g., "step-2")
}

interface FunnelVisualizerProps {
  steps: FunnelStep[];
  name: string;
  connections?: FunnelConnection[];  // Optional connections from database
}

interface StepData {
  label: string;
  visitors: number;
  dropoff: number;
  conversionRate: number;
}

function StepNode({ data }: { data: StepData }) {
  return (
    <div className="relative">
      {/* Input Handle (Left) - Where connections come IN */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-[#7c5cff] border-2 border-white"
        style={{ left: -8 }}
      />

      <div className="bg-[#0a0a0a] border-2 border-[#7c5cff] rounded-xl p-4 min-w-[200px] shadow-lg hover:border-[#00d4aa] transition-all cursor-pointer">
        <div className="flex flex-col gap-2">
          <h3 className="text-[14px] font-semibold text-[#fafafa] mb-2">
            {data.label}
          </h3>
        <div className="flex items-center gap-2 text-[12px] text-[#888888]">
          <Users className="w-3.5 h-3.5 text-[#7c5cff]" />
          <span>{data.visitors.toLocaleString()} visitors</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#888888]">
          <Percent className="w-3.5 h-3.5 text-[#00d4aa]" />
          <span>{data.conversionRate.toFixed(1)}% conversion</span>
        </div>
        {data.dropoff > 0 && (
          <div className="flex items-center gap-2 text-[12px] text-[#ff6b6b]">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{data.dropoff.toFixed(1)}% dropoff</span>
          </div>
        )}
        </div>
      </div>

      {/* Output Handle (Right) - Where connections go OUT */}
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

export default function FunnelVisualizer({ steps, name, connections }: FunnelVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // DEBUG: Log per verificare i dati ricevuti
  console.log('🔍 FunnelVisualizer - Steps ricevuti:', steps);
  console.log('🔍 FunnelVisualizer - Nome funnel:', name);
  console.log('🔍 FunnelVisualizer - Numero steps:', steps?.length);

  // VALIDAZIONE: Verifica che ci siano step
  if (!steps || steps.length === 0) {
    console.error('❌ FunnelVisualizer - Nessuno step ricevuto!');
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
    console.log('🔧 FunnelVisualizer - useEffect triggered, steps:', steps.length);
    console.log('🔧 FunnelVisualizer - Connections from database:', connections);

    // Create nodes - IDs DEVONO INIZIARE DA 1 (come FunnelBuilder) !!!
    const newNodes: Node[] = steps.map((step, index) => {
      const conversionRate = index === 0
        ? 100
        : ((step.visitors / steps[0].visitors) * 100);

      return {
        id: `step-${index + 1}`,  // ← FIX CRITICO: era step-${index}
        type: 'stepNode',
        position: { x: index * 300, y: 100 },
        data: {
          label: step.name,
          visitors: step.visitors,
          dropoff: step.dropoff,
          conversionRate,
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

    console.log('🔧 Nodes creati:', newNodes.length);
    console.log('🔧 Node IDs:', newNodes.map(n => n.id));
    console.log('🔧 Edges creati:', newEdges.length);
    console.log('🔧 Edge details:', newEdges.map(e => `${e.id}: ${e.source} → ${e.target}`));

    setNodes(newNodes);
    setEdges(newEdges);

    console.log('✅ Nodes e edges impostati!');
    console.log('🔍 Connections from database:', connections);
  }, [steps, connections, setNodes, setEdges]);

  // DEBUG: Log dopo inizializzazione state (RENDER-TIME)
  console.log('🔍 RENDER - Nodes in state:', nodes.length, nodes);
  console.log('🔍 RENDER - Edges in state:', edges.length, edges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const closeDetails = () => {
    setSelectedNode(null);
  };

  return (
    <ReactFlowProvider>
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
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
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
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[11px] text-[#666666]">
              Click on other steps to compare metrics
            </p>
          </div>
        </div>
      )}
    </div>
    </ReactFlowProvider>
  );
}
