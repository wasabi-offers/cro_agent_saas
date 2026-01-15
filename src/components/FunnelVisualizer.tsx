"use client";

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Users, TrendingDown, Percent, X } from 'lucide-react';

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
}

interface FunnelVisualizerProps {
  steps: FunnelStep[];
  name: string;
}

interface StepData {
  label: string;
  visitors: number;
  dropoff: number;
  conversionRate: number;
}

function StepNode({ data }: { data: StepData }) {
  return (
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
  );
}

const nodeTypes = {
  stepNode: StepNode,
};

export default function FunnelVisualizer({ steps, name }: FunnelVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Calculate positions and create nodes
  const initialNodes: Node[] = steps.map((step, index) => {
    const conversionRate = index === 0
      ? 100
      : ((step.visitors / steps[0].visitors) * 100);

    return {
      id: `step-${index}`,
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

  // Create edges connecting the steps
  const initialEdges: Edge[] = steps.slice(0, -1).map((_, index) => ({
    id: `edge-${index}`,
    source: `step-${index}`,
    target: `step-${index + 1}`,
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#7c5cff',
      strokeWidth: 3,
      strokeDasharray: '5, 5', // Linee tratteggiate animate
    },
    label: `${((steps[index + 1].visitors / steps[index].visitors) * 100).toFixed(1)}%`,
    labelStyle: {
      fill: '#00d4aa',
      fontSize: 12,
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: '#0a0a0a',
      fillOpacity: 0.9,
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
        <div style={{ width: '100%', height: '400px' }}>
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
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
  );
}
