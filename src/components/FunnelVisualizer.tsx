"use client";

import { useCallback, useState, useEffect, createContext, useContext } from 'react';
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
import { Users, TrendingDown, Percent, X, ExternalLink, FileSearch, BarChart3, Eye } from 'lucide-react';
import StepDataAnalysisModal from './StepDataAnalysisModal';
import StepCROPreviewModal from './StepCROPreviewModal';

interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
  url?: string;
  x?: number;  // Visual position X coordinate
  y?: number;  // Visual position Y coordinate
  conversionRate?: number;  // From API: % passing to next page(s) with path attribution
}

interface FunnelConnection {
  source: string;  // Node ID (e.g., "step-1")
  target: string;  // Node ID (e.g., "step-2")
}

interface FunnelVisualizerProps {
  steps: FunnelStep[];
  name: string;
  funnelId?: string;
  connections?: FunnelConnection[];  // Optional connections from database
  onAnalyzePage?: (stepIndex: number) => void;  // Callback when user clicks "Analyze page"
}

interface StepData {
  label: string;
  visitors: number;
  dropoff: number;
  conversionRate: number;
  url?: string;
  funnelId?: string;
  stepIndex?: number;
}

interface StepCardContextType {
  onDataAnalysisClick?: (stepIndex: number) => void;
  onCROPreviewClick?: (stepIndex: number) => void;
}
const StepCardContext = createContext<StepCardContextType>({});

// Replit e concealedqualify: SPA che necessitano JS per renderizzare - sempre scripts=1
// (prima Replit usava scripts=0 causando anteprime vuote per quiz/approval/apply/success)
function shouldUseScripts(label: string, url?: string): boolean {
  const s = (label + ' ' + (url || '')).toLowerCase();
  if (/replit\.com|replit\.dev|repl\.co|concealedqualify\.com/i.test(url || '')) return true;
  if (/quiz|checkout|payment|approval|apply|success|landing|optin|order|carrello|pagamento|clickbank|stripe|lp\d/i.test(s)) return true;
  return true; // default: SPA moderne necessitano JS
}

function StepNode({ data }: { data: StepData }) {
  const hasPreview = !!data.url;
  const useScripts = shouldUseScripts(data.label, data.url);
  const stepIndex = data.stepIndex ?? 0;
  const { onDataAnalysisClick, onCROPreviewClick } = useContext(StepCardContext);

  return (
    <div className="relative">
      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-[#6366F1] border-2 border-white"
        style={{ left: -8 }}
      />

      <div className="bg-white border-2 border-[#6366F1] rounded-xl overflow-hidden shadow-lg hover:border-[#06B6D4] transition-all cursor-pointer" style={{ width: 280 }}>
        {/* Header */}
        <div className="p-3 pb-2">
          <h3 className="text-[13px] font-semibold text-[#0F172A] mb-1.5 truncate">
            {data.label}
          </h3>
            <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
              <Users className="w-3 h-3 text-[#6366F1]" />
              <span>{(data.visitors ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
              <Percent className="w-3 h-3 text-[#06B6D4]" />
              <span>{Number.isFinite(data.conversionRate) ? data.conversionRate.toFixed(1) : '0'}%</span>
            </div>
            {(data.dropoff ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[#EF4444]">
                <TrendingDown className="w-3 h-3" />
                <span>{Number.isFinite(data.dropoff) ? data.dropoff.toFixed(1) : '0'}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Page Preview - frame scuro per evitare effetto bianco piatto */}
        <div className="relative overflow-hidden" style={{ height: 160 }}>
          <div className="absolute inset-0 bg-[#F8FAFC] border-t border-[#CBD5E1]" />
          {hasPreview ? (
            <>
              <div className="absolute inset-2 rounded-md overflow-hidden border border-[#333] bg-[#1E293B]">
                <iframe
                  src={`/api/proxy-page?url=${encodeURIComponent(data.url!)}&scripts=${useScripts ? '1' : '0'}`}
                  title={`Preview: ${data.label}`}
                  referrerPolicy="no-referrer"
                  className="absolute top-0 left-0 border-0 pointer-events-none w-[1280px] h-[800px]"
                  style={{
                    transform: 'scale(0.22)',
                    transformOrigin: 'top left',
                  }}
                  sandbox="allow-same-origin allow-scripts"
                  allow="autoplay"
                  loading="lazy"
                  tabIndex={-1}
                />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[10px] text-[#555555] text-center px-2">
                {data.url ? 'Preview loading...' : 'Add URL in Edit Funnel'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-2 flex gap-2 border-t border-[#CBD5E1]">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDataAnalysisClick?.(stepIndex); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#6366F1] rounded-lg text-[10px] font-medium transition-colors"
          >
            <BarChart3 className="w-3 h-3" />
            Data
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCROPreviewClick?.(stepIndex); }}
            disabled={!data.url}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-[#06B6D4] rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-3 h-3" />
            CRO
          </button>
        </div>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-[#06B6D4] border-2 border-white"
        style={{ right: -8 }}
      />
    </div>
  );
}

const nodeTypes = {
  stepNode: StepNode,
};

// Componente interno con accesso a ReactFlow
function FunnelVisualizerInner({ steps, name, funnelId, connections, onAnalyzePage }: FunnelVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dataAnalysisStep, setDataAnalysisStep] = useState<number | null>(null);
  const [croPreviewStep, setCroPreviewStep] = useState<number | null>(null);
  const { fitView } = useReactFlow();

  // VALIDAZIONE: Verifica che ci siano step
  if (!steps || steps.length === 0) {
    return (
      <div className="bg-white border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-[#EF4444] text-[16px]">⚠️ Error: No steps found in funnel</p>
        <p className="text-[#64748B] text-[13px] mt-2">Check that the funnel was created correctly</p>
      </div>
    );
  }

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Inizializza nodes ed edges quando cambiano gli steps (COPIATO DA FunnelBuilder)
  useEffect(() => {
    // Create nodes - IDs DEVONO INIZIARE DA 1 (come FunnelBuilder) !!!
    // Build map: step index -> indices of direct next steps (from connections)
    const outgoing = new Map<number, number[]>();
    for (let i = 0; i < steps.length; i++) outgoing.set(i, []);
    if (connections && connections.length > 0) {
      for (const conn of connections) {
        const srcIdx = parseInt(conn.source.replace('step-', ''), 10) - 1;
        const tgtIdx = parseInt(conn.target.replace('step-', ''), 10) - 1;
        if (srcIdx >= 0 && srcIdx < steps.length && tgtIdx >= 0 && tgtIdx < steps.length) {
          outgoing.get(srcIdx)!.push(tgtIdx);
        }
      }
    } else {
      // Linear fallback: step i -> step i+1
      for (let i = 0; i < steps.length - 1; i++) outgoing.get(i)!.push(i + 1);
    }

    const newNodes: Node[] = steps.map((step, index) => {
      const stepVisitors = step.visitors ?? 0;
      // Use API conversionRate when available (path attribution - correct for branched flows)
      let conversionRate = step.conversionRate;
      if (conversionRate === undefined || conversionRate === null) {
        const nextIndices = outgoing.get(index) ?? [];
        const nextVisitors = nextIndices.reduce((sum, j) => sum + (steps[j]?.visitors ?? 0), 0);
        conversionRate = stepVisitors > 0 && nextVisitors >= 0
          ? (nextVisitors / stepVisitors) * 100
          : 0;
      }

      return {
        id: `step-${index + 1}`,  // ← FIX CRITICO: era step-${index}
        type: 'stepNode',
        position: {
          x: step.x !== undefined ? step.x : index * 300,  // Use saved position or default
          y: step.y !== undefined ? step.y : 100            // Use saved position or default
        },
        data: {
          label: step.name,
          visitors: step.visitors ?? 0,
          dropoff: step.dropoff ?? 0,
          conversionRate: Number.isFinite(conversionRate) ? conversionRate : 0,
          url: step.url,
          funnelId,
          stepIndex: index,
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
            stroke: '#6366F1',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6366F1',
            width: 20,
            height: 20,
          },
          label: '→',
          labelStyle: {
            fill: '#06B6D4',
            fontSize: 14,
            fontWeight: 700,
          },
          labelBgStyle: {
            fill: '#0B0F19',
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
            stroke: '#6366F1',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6366F1',
            width: 20,
            height: 20,
          },
          label: '→',
          labelStyle: {
            fill: '#06B6D4',
            fontSize: 14,
            fontWeight: 700,
          },
          labelBgStyle: {
            fill: '#0B0F19',
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

  const stepCardContextValue: StepCardContextType = {
    onDataAnalysisClick: funnelId ? setDataAnalysisStep : undefined,
    onCROPreviewClick: setCroPreviewStep,
  };

  return (
    <StepCardContext.Provider value={stepCardContextValue}>
    <div className="relative">
      <div className="bg-white border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#CBD5E1]">
          <h2 className="text-[18px] font-semibold text-[#0F172A]">
            Funnel Flow: {name}
          </h2>
          <p className="text-[13px] text-[#64748B] mt-1">
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
              style: { stroke: '#6366F1', strokeWidth: 3 },
            }}
            elementsSelectable={true}
            nodesConnectable={false}
            nodesDraggable={false}
            edgesFocusable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#333" gap={16} />
            <Controls className="bg-white border border-white/10 rounded-lg" />
          </ReactFlow>
        </div>
      </div>

      {/* Details Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white border border-[#6366F1] rounded-xl p-6 w-96 shadow-2xl z-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">
                Step Details
              </h3>
              <p className="text-[14px] text-[#64748B]">
                {selectedNode.data.label}
              </p>
            </div>
            <button
              onClick={closeDetails}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#6366F1]" />
                <span className="text-[12px] text-[#64748B]">Total Visitors</span>
              </div>
              <p className="text-[24px] font-bold text-[#0F172A]">
                {(selectedNode.data.visitors ?? 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-[#06B6D4]" />
                <span className="text-[12px] text-[#64748B]">Conversion Rate</span>
              </div>
              <p className="text-[24px] font-bold text-[#0F172A]">
                {Number.isFinite(selectedNode.data.conversionRate) ? selectedNode.data.conversionRate.toFixed(1) : '0'}%
              </p>
            </div>

            {selectedNode.data.dropoff > 0 && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-[#EF4444]" />
                  <span className="text-[12px] text-[#64748B]">Drop-off Rate</span>
                </div>
                <p className="text-[24px] font-bold text-[#0F172A]">
                  {Number.isFinite(selectedNode.data.dropoff) ? selectedNode.data.dropoff.toFixed(1) : '0'}%
                </p>
                <p className="text-[11px] text-[#64748B] mt-2">
                  {Math.round((selectedNode.data.visitors ?? 0) * ((selectedNode.data.dropoff ?? 0) / 100)).toLocaleString()} visitors left at this stage
                </p>
              </div>
            )}

            {selectedNode.data.url && (
              <div className="bg-[#1E293B] border border-[#CBD5E1] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-[#6366F1]" />
                  <span className="text-[12px] text-[#64748B]">URL</span>
                </div>
                <a
                  href={selectedNode.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#6366F1] hover:text-[#06B6D4] break-all line-clamp-2 block"
                >
                  {selectedNode.data.url}
                </a>
              </div>
            )}

            {/* Page Preview */}
            {selectedNode.data.url && (
              <div className="relative rounded-lg overflow-hidden border border-[#333] bg-[#1E293B]" style={{ height: 180 }}>
                <iframe
                  src={`/api/proxy-page?url=${encodeURIComponent(selectedNode.data.url)}&scripts=${shouldUseScripts(selectedNode.data.label, selectedNode.data.url) ? '1' : '0'}`}
                  title={`Preview: ${selectedNode.data.label}`}
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

          <div className="mt-4 pt-4 border-t border-[#CBD5E1] space-y-3">
            {onAnalyzePage && selectedNode.data.url && (
              <button
                onClick={() => {
                  const stepIndex = parseInt(selectedNode.id.replace('step-', ''), 10) - 1;
                  onAnalyzePage(stepIndex);
                  closeDetails();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6366F1] hover:bg-[#6366F1] text-white text-[13px] font-medium rounded-lg transition-colors"
              >
                <FileSearch className="w-4 h-4" />
                Page Analysis
              </button>
            )}
            <p className="text-[11px] text-[#64748B]">
              Click on other steps to compare metrics
            </p>
          </div>
        </div>
      )}

      {/* Data Analysis Modal */}
      {dataAnalysisStep !== null && funnelId && steps[dataAnalysisStep] && (
        <StepDataAnalysisModal
          isOpen={true}
          onClose={() => setDataAnalysisStep(null)}
          stepName={steps[dataAnalysisStep].name}
          stepUrl={steps[dataAnalysisStep].url}
          funnelId={funnelId}
          stepVisitors={steps[dataAnalysisStep].visitors ?? 0}
          stepDropoff={steps[dataAnalysisStep].dropoff ?? 0}
          stepConversionRate={
            dataAnalysisStep === 0
              ? 100
              : (steps[0]?.visitors ?? 0) > 0
                ? ((steps[dataAnalysisStep].visitors ?? 0) / (steps[0].visitors ?? 1)) * 100
                : 0
          }
        />
      )}

      {/* CRO Preview Modal */}
      {croPreviewStep !== null && steps[croPreviewStep]?.url && (
        <StepCROPreviewModal
          isOpen={true}
          onClose={() => setCroPreviewStep(null)}
          stepName={steps[croPreviewStep].name}
          stepUrl={steps[croPreviewStep].url!}
        />
      )}
    </div>
    </StepCardContext.Provider>
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
