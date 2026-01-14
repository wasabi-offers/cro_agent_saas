"use client";

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
}

interface FunnelBuilderProps {
  onSave: (funnel: { name: string; steps: FunnelStep[] }) => void;
  onCancel: () => void;
}

interface StepNodeData {
  label: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, label: string) => void;
}

function StepNode({ data, id }: { data: StepNodeData; id: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleSave = () => {
    if (label.trim()) {
      data.onEdit(id, label);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border-2 border-[#7c5cff] rounded-xl p-4 min-w-[200px] shadow-lg hover:border-[#00d4aa] transition-all">
      <div className="flex flex-col gap-2">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setLabel(data.label);
                  setIsEditing(false);
                }
              }}
              className="w-full px-2 py-1 bg-[#111111] border border-[#7c5cff] rounded text-[14px] text-[#fafafa] focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-2 py-1 bg-[#00d4aa] text-white rounded text-[12px] hover:bg-[#00c499] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setLabel(data.label);
                  setIsEditing(false);
                }}
                className="flex-1 px-2 py-1 bg-[#666666] text-white rounded text-[12px] hover:bg-[#555555] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3
                className="text-[14px] font-semibold text-[#fafafa] cursor-pointer"
                onDoubleClick={() => setIsEditing(true)}
              >
                {data.label}
              </h3>
              <button
                onClick={() => data.onDelete(id)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#ff6b6b]/10 text-[#ff6b6b] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#666666]">
              Double-click to edit
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  stepNode: StepNode,
};

export default function FunnelBuilder({ onSave, onCancel }: FunnelBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [funnelName, setFunnelName] = useState('');
  const [error, setError] = useState('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#7c5cff',
        strokeWidth: 2,
      },
    }, eds)),
    [setEdges]
  );

  const addStep = () => {
    const newId = `step-${nodes.length + 1}`;
    const newNode: Node = {
      id: newId,
      type: 'stepNode',
      position: { x: nodes.length * 300, y: 100 },
      data: {
        label: `Step ${nodes.length + 1}`,
        onDelete: deleteNode,
        onEdit: editNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  const editNode = (id: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label } }
          : node
      )
    );
  };

  const handleSave = () => {
    setError('');

    if (!funnelName.trim()) {
      setError('Please enter a funnel name');
      return;
    }

    if (nodes.length < 2) {
      setError('Please add at least 2 steps to your funnel');
      return;
    }

    // Build step order based on connections
    const stepOrder: string[] = [];
    const visited = new Set<string>();

    // Find the starting node (no incoming edges)
    const incomingEdges = new Set(edges.map(e => e.target));
    const startNode = nodes.find(n => !incomingEdges.has(n.id));

    if (!startNode) {
      setError('Please connect your funnel steps in order (drag from one step to another)');
      return;
    }

    // Build ordered list
    let currentId: string | undefined = startNode.id;
    while (currentId && !visited.has(currentId)) {
      stepOrder.push(currentId);
      visited.add(currentId);

      const nextEdge = edges.find(e => e.source === currentId);
      currentId = nextEdge?.target;
    }

    if (stepOrder.length !== nodes.length) {
      setError('All steps must be connected in a linear flow');
      return;
    }

    // Generate funnel with mock data
    const steps: FunnelStep[] = stepOrder.map((id, index) => {
      const node = nodes.find(n => n.id === id)!;
      const baseVisitors = 10000;
      const dropoffRate = 0.25; // 25% dropoff per step
      const visitors = Math.round(baseVisitors * Math.pow(1 - dropoffRate, index));
      const previousVisitors = index === 0 ? baseVisitors : Math.round(baseVisitors * Math.pow(1 - dropoffRate, index - 1));
      const dropoff = index === 0 ? 0 : ((previousVisitors - visitors) / previousVisitors) * 100;

      return {
        name: node.data.label,
        visitors,
        dropoff,
      };
    });

    onSave({
      name: funnelName,
      steps,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-[#fafafa]">
            Build Your Funnel
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-[#888888] hover:text-[#fafafa] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[14px] text-[#888888] mb-2">
              Funnel Name
            </label>
            <input
              type="text"
              value={funnelName}
              onChange={(e) => setFunnelName(e.target.value)}
              placeholder="e.g., E-commerce Checkout Flow"
              className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-[#fafafa] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={addStep}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7c5cff] text-white rounded-xl text-[14px] font-medium hover:bg-[#6b4ee6] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
            <p className="text-[13px] text-[#666666]">
              {nodes.length} step{nodes.length !== 1 ? 's' : ''} added • Drag from one step to another to connect them
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#ff6b6b] text-[14px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-[14px] text-[#888888]">
            Drag and drop to rearrange • Double-click steps to rename • Connect steps by dragging from one to another
          </p>
        </div>
        <div style={{ width: '100%', height: '500px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#333" gap={16} />
            <Controls className="bg-[#0a0a0a] border border-white/10 rounded-lg" />
            <MiniMap
              className="bg-[#0a0a0a] border border-white/10 rounded-lg"
              nodeColor="#7c5cff"
              maskColor="rgba(0, 0, 0, 0.6)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-[#111111] border border-white/10 text-[#888888] rounded-xl text-[14px] font-medium hover:text-[#fafafa] hover:border-[#7c5cff]/50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl text-[14px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all"
        >
          <Save className="w-4 h-4" />
          Create Funnel
        </button>
      </div>
    </div>
  );
}
