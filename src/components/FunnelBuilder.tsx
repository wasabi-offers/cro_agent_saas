"use client";

import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  ConnectionMode,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Trash2, Save, X, ArrowRight, Link as LinkIcon, ExternalLink, Code, Copy, Check } from 'lucide-react';
import { generateTrackingScript } from '@/lib/tracking-script';

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
  url?: string;
}

interface FunnelConnection {
  source: string;  // Node ID (e.g., "step-1")
  target: string;  // Node ID (e.g., "step-2")
}

interface FunnelBuilderProps {
  onSave: (funnel: { name: string; steps: FunnelStep[]; connections?: FunnelConnection[] }) => void;
  onCancel: () => void;
  initialFunnel?: { name: string; steps: FunnelStep[]; connections?: FunnelConnection[] };
}

interface StepNodeData {
  label: string;
  url?: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, label: string, url?: string) => void;
}

function StepNode({ data, id }: { data: StepNodeData; id: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [url, setUrl] = useState(data.url || '');

  const handleSave = () => {
    if (label.trim()) {
      data.onEdit(id, label, url);
      setIsEditing(false);
    }
  };

  return (
    <div className="relative">
      {/* Input Handle (Left) - Where connections come IN */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-[#7c5cff] border-2 border-white"
        style={{ left: -8 }}
      />

      <div className="bg-[#0a0a0a] border-2 border-[#7c5cff] rounded-xl p-4 min-w-[220px] shadow-lg hover:border-[#00d4aa] transition-all">
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-[#888888] mb-1 block">Nome Step</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleSave();
                    if (e.key === 'Escape') {
                      setLabel(data.label);
                      setUrl(data.url || '');
                      setIsEditing(false);
                    }
                  }}
                  className="w-full px-2 py-1 bg-[#111111] border border-[#7c5cff] rounded text-[14px] text-[#fafafa] focus:outline-none"
                  autoFocus
                  placeholder="e.g., Landing Page"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#888888] mb-1 block">URL (opzionale)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666666]" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) handleSave();
                      if (e.key === 'Escape') {
                        setLabel(data.label);
                        setUrl(data.url || '');
                        setIsEditing(false);
                      }
                    }}
                    className="w-full pl-8 pr-2 py-1 bg-[#111111] border border-[#7c5cff] rounded text-[13px] text-[#fafafa] focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
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
                    setUrl(data.url || '');
                    setIsEditing(false);
                  }}
                  className="flex-1 px-2 py-1 bg-[#666666] text-white rounded text-[12px] hover:bg-[#555555] transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-[#666666]">Ctrl+Enter per salvare</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <h3
                  className="text-[14px] font-semibold text-[#fafafa] cursor-pointer flex-1"
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

              {/* URL Display */}
              {data.url ? (
                <div className="mb-2 bg-[#111111] border border-[#2a2a2a] rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-3 h-3 text-[#00d4aa] flex-shrink-0" />
                    <span className="text-[11px] text-[#888888] truncate flex-1" title={data.url}>
                      {data.url}
                    </span>
                    <a
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 text-[#7c5cff] hover:text-[#00d4aa] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mb-2 flex items-center gap-1 text-[10px] text-[#666666]">
                  <LinkIcon className="w-3 h-3" />
                  <span>Nessun URL impostato</span>
                </div>
              )}

              <p className="text-[11px] text-[#666666]">
                Double-click to edit
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#7c5cff] mt-1">
                <ArrowRight className="w-3 h-3" />
                <span>Drag from circle to connect</span>
              </div>
            </>
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

export default function FunnelBuilder({ onSave, onCancel, initialFunnel }: FunnelBuilderProps) {
  const [funnelName, setFunnelName] = useState(initialFunnel?.name || '');
  const [error, setError] = useState('');
  const [showTutorial, setShowTutorial] = useState(!initialFunnel);
  const [showTrackingSetup, setShowTrackingSetup] = useState(false);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  // Track if we've initialized from initialFunnel to prevent re-initialization
  const hasInitialized = useRef(false);

  // Initialize state hooks first
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Define node functions after state hooks
  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const editNode = useCallback((id: string, label: string, url?: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label, url } }
          : node
      )
    );
  }, [setNodes]);

  // Initialize from existing funnel using useEffect - ONLY ONCE
  useEffect(() => {
    // Only initialize if we have initialFunnel AND haven't initialized yet
    if (!initialFunnel || hasInitialized.current) return;

    console.log('🎯 FUNNEL BUILDER - Initializing from initialFunnel (one-time only)');
    hasInitialized.current = true; // Mark as initialized to prevent re-runs

    const initialNodes: Node[] = initialFunnel.steps.map((step, index) => ({
      id: `step-${index + 1}`,
      type: 'stepNode',
      position: {
        x: step.x !== undefined ? step.x : index * 300,  // Use saved position or default
        y: step.y !== undefined ? step.y : 100            // Use saved position or default
      },
      data: {
        label: step.name,
        url: step.url,
        onDelete: deleteNode,
        onEdit: editNode,
      },
    }));

    // Use connections from database if available, otherwise create linear flow
    const initialEdges: Edge[] = initialFunnel.connections && initialFunnel.connections.length > 0
      ? // Load connections from database
        initialFunnel.connections.map((conn, index) => ({
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
      : // Fallback: create linear flow for old funnels
        initialFunnel.steps.slice(0, -1).map((_, index) => ({
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

    setNodes(initialNodes);
    setEdges(initialEdges);
    console.log(`🎯 FUNNEL BUILDER - Initialized with ${initialNodes.length} nodes and ${initialEdges.length} edges`);
  }, [initialFunnel, deleteNode, editNode, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
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
      }, eds));
      // Visual feedback
      setError('');
    },
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
        url: '',
        onDelete: deleteNode,
        onEdit: editNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const copyTrackingScript = async (nodeId: string, script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      setCopiedScriptId(nodeId);
      setTimeout(() => setCopiedScriptId(null), 2000);
    } catch (error) {
      console.error('Failed to copy script:', error);
    }
  };

  const handleSave = () => {
    setError('');

    if (!funnelName.trim()) {
      setError('❌ Inserisci un nome per il funnel');
      return;
    }

    if (nodes.length < 2) {
      setError('❌ Aggiungi almeno 2 step al tuo funnel');
      return;
    }

    if (edges.length === 0) {
      setError('❌ Collega gli step: trascina dal cerchio verde (→) di uno step al cerchio viola (←) di un altro step');
      return;
    }

    // Validate that all nodes are connected (no isolated nodes)
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const isolatedNodes = nodes.filter(n => !connectedNodes.has(n.id));
    if (isolatedNodes.length > 0) {
      setError(`❌ Alcuni step non sono collegati: ${isolatedNodes.map(n => n.data.label).join(', ')}. Collega tutti gli step al funnel.`);
      return;
    }

    // Find starting nodes (nodes with no incoming edges)
    const incomingEdges = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !incomingEdges.has(n.id));

    if (startNodes.length === 0) {
      setError('❌ Il funnel deve avere almeno uno step iniziale (senza frecce in entrata)');
      return;
    }

    // Perform topological sort to order steps (supports branching and merging)
    const stepOrder: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string): boolean => {
      if (visited.has(nodeId)) return true;
      if (visiting.has(nodeId)) {
        setError('❌ Il funnel contiene un ciclo (loop). Rimuovi le connessioni circolari.');
        return false;
      }

      visiting.add(nodeId);

      // Visit all nodes that this node points to
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (!visit(edge.target)) return false;
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      stepOrder.unshift(nodeId); // Add to beginning for correct order
      return true;
    };

    // Start from all starting nodes
    for (const startNode of startNodes) {
      if (!visit(startNode.id)) return;
    }

    // CRITICAL FIX: Save steps in their ORIGINAL order (by node ID), not topologically sorted!
    // The topological sort is only for validation, not for reordering the saved data
    // This prevents connection IDs from becoming mismatched when reloading

    // Calculate depth for each node (for metrics calculation)
    const getDepth = (nodeId: string): number => {
      const incoming = edges.filter(e => e.target === nodeId);
      if (incoming.length === 0) return 0;
      return Math.max(...incoming.map(e => getDepth(e.source))) + 1;
    };

    // Generate steps in ORIGINAL order (sorted by node ID: step-1, step-2, step-3...)
    // Initialize with ZERO visitors - real data will come from tracking system
    // SAVE POSITIONS so visual layout is preserved!
    const steps: FunnelStep[] = nodes
      .slice() // Create copy to avoid mutating original
      .sort((a, b) => {
        // Extract numeric part from "step-X" and sort numerically
        const numA = parseInt(a.id.split('-')[1]);
        const numB = parseInt(b.id.split('-')[1]);
        return numA - numB;
      })
      .map(node => {
        return {
          name: node.data.label,
          visitors: 0,  // Will be populated from tracking data
          dropoff: 0,   // Will be calculated from tracking data
          url: node.data.url || undefined,
          x: node.position.x,  // Save visual position X
          y: node.position.y,  // Save visual position Y
        };
      });

    // Convert edges to simple connection format - NO REMAPPING NEEDED!
    // Since we're saving steps in original order, connection IDs remain valid
    // CRITICAL: Filter out connections that reference non-existent nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const connections = edges
      .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map(edge => ({
        source: edge.source,
        target: edge.target,
      }));

    console.log('🔧 FUNNEL BUILDER - Nodes in state:', nodes.length);
    console.log('🔧 FUNNEL BUILDER - Node IDs:', nodes.map(n => n.id));
    console.log('🔧 FUNNEL BUILDER - Edges in state:', edges.length);
    console.log('🔧 FUNNEL BUILDER - Edges details:', edges.map(e => `${e.id}: ${e.source} → ${e.target}`));
    console.log('🔧 FUNNEL BUILDER - Connections after filtering:', connections);
    console.log('🔧 FUNNEL BUILDER - Filtered out:', edges.length - connections.length, 'invalid connections');
    console.log('🔧 FUNNEL BUILDER - Steps being saved:', steps.map(s => s.name));

    onSave({
      name: funnelName,
      steps,
      connections,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-[#fafafa]">
            {initialFunnel ? 'Modifica Funnel' : 'Costruisci il tuo Funnel'}
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
              Aggiungi Step
            </button>
            <p className="text-[13px] text-[#666666]">
              {nodes.length} step{nodes.length !== 1 ? 's' : ''} aggiunt{nodes.length !== 1 ? 'i' : 'o'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#ff6b6b] text-[14px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Banner */}
      {showTutorial && nodes.length === 0 && (
        <div className="bg-gradient-to-r from-[#7c5cff]/20 to-[#00d4aa]/20 border border-[#7c5cff]/30 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-[#fafafa]">
              👋 Come costruire il tuo funnel
            </h3>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-[#888888] hover:text-[#fafafa] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-[#7c5cff] rounded-lg flex items-center justify-center text-white font-bold mb-3">
                1
              </div>
              <h4 className="text-[14px] font-semibold text-[#fafafa] mb-2">
                Aggiungi Steps
              </h4>
              <p className="text-[13px] text-[#888888]">
                Clicca "Aggiungi Step" per creare le card del tuo funnel (Landing Page, Checkout, Thank You, ecc.)
              </p>
            </div>
            <div className="bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-[#00d4aa] rounded-lg flex items-center justify-center text-white font-bold mb-3">
                2
              </div>
              <h4 className="text-[14px] font-semibold text-[#fafafa] mb-2">
                Collega le Card
              </h4>
              <p className="text-[13px] text-[#888888]">
                Trascina dal <span className="text-[#00d4aa] font-semibold">cerchio verde (→)</span> di una card al <span className="text-[#7c5cff] font-semibold">cerchio viola (←)</span> della card successiva. <span className="text-[#fafafa] font-semibold">Puoi creare più percorsi e ramificazioni!</span>
              </p>
            </div>
            <div className="bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-[#f59e0b] rounded-lg flex items-center justify-center text-white font-bold mb-3">
                3
              </div>
              <h4 className="text-[14px] font-semibold text-[#fafafa] mb-2">
                Personalizza
              </h4>
              <p className="text-[13px] text-[#888888]">
                Doppio click sul nome per modificare, trascina per riposizionare, usa il cestino per eliminare
              </p>
            </div>
          </div>
          <div className="mt-4 bg-[#0a0a0a]/80 border border-[#00d4aa]/30 rounded-xl p-4">
            <p className="text-[12px] text-[#888888] mb-2">💡 <span className="text-[#fafafa] font-semibold">Esempi di funnel che puoi creare:</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[#888888]">
              <div>
                <span className="text-[#00d4aa]">→</span> <span className="text-[#fafafa]">Lineare:</span> Landing → Checkout → Thank You
              </div>
              <div>
                <span className="text-[#00d4aa]">→</span> <span className="text-[#fafafa]">Ramificato:</span> Landing → (Product A / Product B) → Checkout
              </div>
              <div>
                <span className="text-[#00d4aa]">→</span> <span className="text-[#fafafa]">Convergente:</span> (Landing A / Landing B) → Checkout → Thank You
              </div>
              <div>
                <span className="text-[#00d4aa]">→</span> <span className="text-[#fafafa]">Complesso:</span> Più percorsi che si uniscono e si dividono
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-[#111111]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00d4aa]"></div>
                <span className="text-[12px] text-[#888888]">Cerchio verde = Uscita (trascina da qui)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#7c5cff]"></div>
                <span className="text-[12px] text-[#888888]">Cerchio viola = Entrata (collega qui)</span>
              </div>
            </div>
            {nodes.length > 0 && (
              <button
                onClick={() => setShowTutorial(true)}
                className="text-[12px] text-[#7c5cff] hover:text-[#00d4aa] transition-colors"
              >
                Mostra tutorial
              </button>
            )}
          </div>
        </div>
        <div style={{ width: '100%', height: '500px' }} className="relative">
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
          </ReactFlow>

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7c5cff]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-[#7c5cff]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#fafafa] mb-2">
                  Inizia aggiungendo il primo step
                </h3>
                <p className="text-[14px] text-[#888888]">
                  Clicca "Aggiungi Step" sopra per creare la tua prima card
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Setup Section */}
      {nodes.filter(node => node.data.url).length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowTrackingSetup(!showTrackingSetup)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-[16px] font-semibold text-[#fafafa]">
                  🔍 Tracking Setup
                </h3>
                <p className="text-[13px] text-[#888888]">
                  Script di tracking per {nodes.filter(node => node.data.url).length} landing page{nodes.filter(node => node.data.url).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className={`text-[#888888] transition-transform ${showTrackingSetup ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showTrackingSetup && (
            <div className="px-6 py-6 border-t border-white/10 space-y-6">
              {/* Instructions */}
              <div className="bg-gradient-to-r from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/30 rounded-xl p-4">
                <h4 className="text-[14px] font-semibold text-[#fafafa] mb-2">
                  📋 Come usare
                </h4>
                <ol className="text-[13px] text-[#888888] space-y-1.5 list-decimal list-inside">
                  <li>Copia lo script per ogni landing page cliccando il pulsante "Copia"</li>
                  <li>Incolla lo script nel <code className="px-1.5 py-0.5 bg-[#0a0a0a] rounded text-[#00d4aa]">&lt;head&gt;</code> della tua landing page HTML</li>
                  <li>Lo script inizierà automaticamente a tracciare click, scroll e movimenti del mouse</li>
                  <li>I dati saranno visibili nella Heatmap dopo che gli utenti visitano la pagina</li>
                </ol>
              </div>

              {/* Script for each node with URL */}
              <div className="space-y-4">
                {nodes
                  .filter(node => node.data.url)
                  .map(node => {
                    const apiEndpoint = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/api/track`;
                    const landingId = `landing_${node.id}`;
                    const script = generateTrackingScript(landingId, apiEndpoint);
                    const isCopied = copiedScriptId === node.id;

                    return (
                      <div key={node.id} className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-[#7c5cff] rounded-lg flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                              {node.id.split('-')[1]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[14px] font-semibold text-[#fafafa] mb-0.5">{node.data.label}</h5>
                              <div className="flex items-center gap-2 text-[11px] text-[#888888] min-w-0">
                                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate block">{node.data.url}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => copyTrackingScript(node.id, `<script>\n${script}\n</script>`)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                              isCopied
                                ? 'bg-[#00d4aa] text-white'
                                : 'bg-[#7c5cff] text-white hover:bg-[#6b4ee6]'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copiato!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copia Script
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="bg-[#0a0a0a] rounded-lg p-3 overflow-x-auto">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[11px] text-[#888888] select-none">Landing ID:</span>
                              <code className="text-[11px] font-mono text-[#00d4aa]">{landingId}</code>
                            </div>
                            <pre className="text-[11px] font-mono text-[#888888] overflow-x-auto">
                              <code>{`<script>\n${script.substring(0, 200)}...\n</script>`}</code>
                            </pre>
                            <p className="text-[10px] text-[#666666] mt-2 italic">
                              Lo script completo sarà copiato quando clicchi "Copia Script"
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Warning */}
              <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4">
                <h4 className="text-[14px] font-semibold text-[#ff6b6b] mb-2">
                  ⚠️ Importante
                </h4>
                <ul className="text-[13px] text-[#888888] space-y-1 list-disc list-inside">
                  <li>Ogni landing page ha uno script unico con il suo <code className="px-1.5 py-0.5 bg-[#0a0a0a] rounded text-[#00d4aa]">landingId</code></li>
                  <li>Non modificare il <code className="px-1.5 py-0.5 bg-[#0a0a0a] rounded text-[#00d4aa]">landingId</code> altrimenti i dati non saranno tracciati correttamente</li>
                  <li>Assicurati che le tue landing pages possano contattare il dominio: <code className="px-1.5 py-0.5 bg-[#0a0a0a] rounded text-[#7c5cff]">{typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-[#111111] border border-white/10 text-[#888888] rounded-xl text-[14px] font-medium hover:text-[#fafafa] hover:border-[#7c5cff]/50 transition-all"
        >
          Annulla
        </button>
        <button
          onClick={handleSave}
          disabled={nodes.length < 2}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl text-[14px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {initialFunnel ? 'Salva Modifiche' : 'Crea Funnel'}
        </button>
      </div>
    </div>
  );
}
