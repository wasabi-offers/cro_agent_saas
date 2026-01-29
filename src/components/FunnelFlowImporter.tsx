"use client";

import { useState } from "react";
import { Upload, X, Plus, Trash2, Eye, Save, AlertCircle, CheckCircle, GitBranch } from "lucide-react";

interface ParsedStep {
  name: string;
  url: string;
  flowIndex: number; // which flow this step belongs to
}

interface ParsedFlow {
  name: string;
  steps: ParsedStep[];
}

interface FunnelFlowImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (funnel: { name: string; steps: any[]; connections?: any[] }) => void;
}

// Parse a single line to extract step name and URL
function parseLine(line: string): { name: string; url: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return null;

  // Pattern: "Step Name : URL" or "Step Name: URL"
  const colonMatch = trimmed.match(/^(.+?)\s*:\s*(https?:\/\/.+)$/i);
  if (colonMatch) {
    let name = colonMatch[1].trim();
    const url = colonMatch[2].trim();
    // Clean up common prefixes/suffixes
    name = name.replace(/^[-•*]\s*/, '').trim();
    return { name, url };
  }

  // Pattern: just a URL - derive name from path
  const urlMatch = trimmed.match(/^(https?:\/\/.+)$/i);
  if (urlMatch) {
    const url = urlMatch[1].trim();
    try {
      const parsed = new URL(url);
      let pathName = parsed.pathname.replace(/\.(php|html|htm|asp|aspx)$/i, '');
      pathName = pathName.replace(/^\//, '').replace(/\/$/, '');
      if (!pathName || pathName === '/') {
        pathName = 'Home';
      }
      // Convert path to readable name
      const name = pathName
        .split(/[-_/]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return { name, url };
    } catch {
      return null;
    }
  }

  return null;
}

// Parse all flows from text input
function parseFlows(text: string): ParsedFlow[] {
  const lines = text.split('\n');
  const flows: ParsedFlow[] = [];
  let currentFlow: ParsedFlow = { name: '', steps: [] };
  let flowIndex = 0;
  let hasStartedFlow = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for flow header (e.g., "Flow 1:", "Flusso 1:", "--- Flow 1 ---", etc.)
    const flowHeader = trimmed.match(/^(?:flow|flusso|funnel)\s*(\d+)\s*:?\s*(.*)$/i)
      || trimmed.match(/^---+\s*(.+?)\s*---+$/);

    if (flowHeader) {
      // Save previous flow if it has steps
      if (currentFlow.steps.length > 0) {
        flows.push(currentFlow);
      }
      flowIndex = flows.length;
      const flowName = flowHeader[2]?.trim() || flowHeader[1]?.trim() || `Flow ${flowIndex + 1}`;
      currentFlow = { name: flowName, steps: [] };
      hasStartedFlow = true;
      continue;
    }

    // Empty line could be a flow separator
    if (!trimmed) {
      if (hasStartedFlow && currentFlow.steps.length > 0) {
        flows.push(currentFlow);
        flowIndex = flows.length;
        currentFlow = { name: `Flow ${flowIndex + 1}`, steps: [] };
        hasStartedFlow = false;
      }
      continue;
    }

    // Try to parse as a step
    const parsed = parseLine(trimmed);
    if (parsed) {
      hasStartedFlow = true;
      if (currentFlow.name === '' && flows.length === 0) {
        currentFlow.name = `Flow 1`;
      }
      currentFlow.steps.push({
        ...parsed,
        flowIndex,
      });
    }
  }

  // Don't forget the last flow
  if (currentFlow.steps.length > 0) {
    flows.push(currentFlow);
  }

  return flows;
}

// Build the funnel structure with deduplication and connections
function buildFunnelStructure(flows: ParsedFlow[]) {
  // Deduplicate steps by URL
  const urlToStep = new Map<string, { name: string; url: string; id: string; flowIndices: number[] }>();
  let stepCounter = 0;

  for (const flow of flows) {
    for (const step of flow.steps) {
      const normalizedUrl = step.url.replace(/\/$/, '').toLowerCase();
      if (!urlToStep.has(normalizedUrl)) {
        stepCounter++;
        urlToStep.set(normalizedUrl, {
          name: step.name,
          url: step.url,
          id: `step-${stepCounter}`,
          flowIndices: [step.flowIndex],
        });
      } else {
        const existing = urlToStep.get(normalizedUrl)!;
        if (!existing.flowIndices.includes(step.flowIndex)) {
          existing.flowIndices.push(step.flowIndex);
        }
      }
    }
  }

  // Build connections based on flow order
  const connections: { source: string; target: string }[] = [];
  const connectionSet = new Set<string>();

  for (const flow of flows) {
    for (let i = 0; i < flow.steps.length - 1; i++) {
      const sourceUrl = flow.steps[i].url.replace(/\/$/, '').toLowerCase();
      const targetUrl = flow.steps[i + 1].url.replace(/\/$/, '').toLowerCase();

      const sourceStep = urlToStep.get(sourceUrl);
      const targetStep = urlToStep.get(targetUrl);

      if (sourceStep && targetStep) {
        const connKey = `${sourceStep.id}->${targetStep.id}`;
        if (!connectionSet.has(connKey)) {
          connectionSet.add(connKey);
          connections.push({
            source: sourceStep.id,
            target: targetStep.id,
          });
        }
      }
    }
  }

  // Position nodes using a layout algorithm
  const steps = Array.from(urlToStep.values());
  const positioned = layoutNodes(steps, connections);

  return { steps: positioned, connections };
}

// Simple layout algorithm for positioning nodes
function layoutNodes(
  steps: { name: string; url: string; id: string; flowIndices: number[] }[],
  connections: { source: string; target: string }[]
) {
  // Build adjacency for topological sort
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  for (const step of steps) {
    inDegree.set(step.id, 0);
    outEdges.set(step.id, []);
  }
  for (const conn of connections) {
    inDegree.set(conn.target, (inDegree.get(conn.target) || 0) + 1);
    outEdges.get(conn.source)?.push(conn.target);
  }

  // BFS-based level assignment
  const levels = new Map<string, number>();
  const queue: string[] = [];

  for (const step of steps) {
    if ((inDegree.get(step.id) || 0) === 0) {
      queue.push(step.id);
      levels.set(step.id, 0);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;
    for (const next of (outEdges.get(current) || [])) {
      const newLevel = currentLevel + 1;
      if (!levels.has(next) || levels.get(next)! < newLevel) {
        levels.set(next, newLevel);
      }
      inDegree.set(next, (inDegree.get(next) || 0) - 1);
      if (inDegree.get(next) === 0) {
        queue.push(next);
      }
    }
  }

  // Handle any remaining unvisited nodes
  for (const step of steps) {
    if (!levels.has(step.id)) {
      levels.set(step.id, 0);
    }
  }

  // Group by level and assign positions
  const levelGroups = new Map<number, string[]>();
  for (const [id, level] of levels) {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(id);
  }

  const HORIZONTAL_SPACING = 320;
  const VERTICAL_SPACING = 200;

  return steps.map(step => {
    const level = levels.get(step.id) || 0;
    const group = levelGroups.get(level) || [step.id];
    const indexInGroup = group.indexOf(step.id);
    const totalInGroup = group.length;

    // Center the group vertically
    const startY = -(totalInGroup - 1) * VERTICAL_SPACING / 2 + 150;

    return {
      name: step.name,
      url: step.url,
      visitors: 0,
      dropoff: 0,
      x: level * HORIZONTAL_SPACING + 50,
      y: startY + indexInGroup * VERTICAL_SPACING,
    };
  });
}

export default function FunnelFlowImporter({ isOpen, onClose, onImport }: FunnelFlowImporterProps) {
  const [funnelName, setFunnelName] = useState('');
  const [flowTexts, setFlowTexts] = useState<string[]>(['']);
  const [preview, setPreview] = useState<{
    steps: any[];
    connections: any[];
    flows: ParsedFlow[];
  } | null>(null);
  const [error, setError] = useState('');

  const addFlowBox = () => {
    setFlowTexts([...flowTexts, '']);
    setPreview(null);
  };

  const removeFlowBox = (index: number) => {
    if (flowTexts.length > 1) {
      setFlowTexts(flowTexts.filter((_, i) => i !== index));
      setPreview(null);
    }
  };

  const updateFlowText = (index: number, text: string) => {
    const updated = [...flowTexts];
    updated[index] = text;
    setFlowTexts(updated);
    setPreview(null);
  };

  const handlePreview = () => {
    setError('');

    // Parse each flow box
    const allFlows: ParsedFlow[] = [];
    for (let i = 0; i < flowTexts.length; i++) {
      const text = flowTexts[i].trim();
      if (!text) continue;

      const parsed = parseFlows(text);
      if (parsed.length === 0) {
        setError(`Flow ${i + 1}: nessun URL valido trovato. Assicurati di inserire URL completi (es: https://example.com/page)`);
        return;
      }

      // Rename flows to include box index
      parsed.forEach((flow, j) => {
        flow.name = flowTexts.length > 1
          ? `Flow ${i + 1}${parsed.length > 1 ? `.${j + 1}` : ''}`
          : flow.name;
        allFlows.push(flow);
      });
    }

    if (allFlows.length === 0) {
      setError('Inserisci almeno un flusso con URL validi');
      return;
    }

    const { steps, connections } = buildFunnelStructure(allFlows);

    if (steps.length < 2) {
      setError('Servono almeno 2 step per creare un funnel');
      return;
    }

    setPreview({ steps, connections, flows: allFlows });
  };

  const handleImport = () => {
    if (!preview) return;

    if (!funnelName.trim()) {
      setError('Inserisci un nome per il funnel');
      return;
    }

    onImport({
      name: funnelName,
      steps: preview.steps,
      connections: preview.connections,
    });

    // Reset
    setFunnelName('');
    setFlowTexts(['']);
    setPreview(null);
    setError('');
    onClose();
  };

  const handleReset = () => {
    setFunnelName('');
    setFlowTexts(['']);
    setPreview(null);
    setError('');
  };

  if (!isOpen) return null;

  const totalSteps = preview?.steps.length || 0;
  const totalConnections = preview?.connections.length || 0;
  const totalFlows = preview?.flows.length || 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#2a2a2a] p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[20px] font-semibold text-[#fafafa]">
                Importa Flussi Funnel
              </h2>
              <p className="text-[13px] text-[#888888]">
                Incolla i tuoi flussi con URL e il funnel viene costruito automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#111111] rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-[#888888]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Funnel Name */}
          <div>
            <label className="block text-[13px] font-medium text-[#fafafa] mb-2">
              Nome Funnel *
            </label>
            <input
              type="text"
              value={funnelName}
              onChange={(e) => setFunnelName(e.target.value)}
              placeholder="es: Concealed Carry Certification Funnel"
              className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[14px] focus:outline-none focus:border-[#7c5cff] transition-all placeholder:text-[#666666]"
            />
          </div>

          {/* Flow Input Boxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[13px] font-medium text-[#fafafa]">
                Flussi *
              </label>
              <button
                type="button"
                onClick={addFlowBox}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c5cff]/20 border border-[#7c5cff]/30 rounded-lg text-[#7c5cff] text-[12px] font-medium hover:bg-[#7c5cff]/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Aggiungi Flusso
              </button>
            </div>

            <div className="space-y-4">
              {flowTexts.map((text, index) => (
                <div key={index} className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#0a0a0a] border-b border-[#2a2a2a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-[#7c5cff]" />
                      <span className="text-[13px] font-medium text-[#fafafa]">
                        Flusso {index + 1}
                      </span>
                    </div>
                    {flowTexts.length > 1 && (
                      <button
                        onClick={() => removeFlowBox(index)}
                        className="p-1 hover:bg-[#ff6b6b]/10 rounded text-[#666666] hover:text-[#ff6b6b] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => updateFlowText(index, e.target.value)}
                    placeholder={`Incolla il flusso qui, es:\n\nZip Page : https://example.com/validate.php\nQuestions Page : https://example.com/verify.php\nSuccess Page : https://example.com/success.php\nCheckout Page : https://orders.clickbank.net/...\n\nOppure solo gli URL:\nhttps://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3`}
                    rows={8}
                    className="w-full px-4 py-3 bg-transparent text-[#fafafa] text-[13px] font-mono focus:outline-none placeholder:text-[#444444] resize-y"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <GitBranch className="w-5 h-5 text-[#7c5cff] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-[#fafafa] font-medium mb-1">
                  Come funziona
                </p>
                <ul className="text-[12px] text-[#888888] space-y-1 list-disc list-inside">
                  <li>Ogni box rappresenta un flusso separato del tuo funnel</li>
                  <li>Le pagine con lo stesso URL vengono unite automaticamente (shared steps)</li>
                  <li>Le connessioni vengono create seguendo l'ordine delle pagine in ogni flusso</li>
                  <li>Formato supportato: <code className="px-1 py-0.5 bg-[#0a0a0a] rounded text-[#00d4aa]">Nome Pagina : URL</code> oppure solo l'URL</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-[#ff6b6b] text-[14px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Preview Button */}
          {!preview && (
            <button
              onClick={handlePreview}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#111111] border border-[#7c5cff]/30 text-[#7c5cff] rounded-xl text-[14px] font-medium hover:bg-[#7c5cff]/10 transition-all"
            >
              <Eye className="w-4 h-4" />
              Anteprima Funnel
            </button>
          )}

          {/* Preview Section */}
          {preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#fafafa]">
                  Anteprima Funnel
                </h3>
                <button
                  onClick={handleReset}
                  className="text-[12px] text-[#888888] hover:text-[#fafafa] transition-colors"
                >
                  Modifica flussi
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 text-center">
                  <p className="text-[24px] font-bold text-[#7c5cff]">{totalFlows}</p>
                  <p className="text-[12px] text-[#888888]">Flussi</p>
                </div>
                <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 text-center">
                  <p className="text-[24px] font-bold text-[#00d4aa]">{totalSteps}</p>
                  <p className="text-[12px] text-[#888888]">Step Unici</p>
                </div>
                <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 text-center">
                  <p className="text-[24px] font-bold text-[#f59e0b]">{totalConnections}</p>
                  <p className="text-[12px] text-[#888888]">Connessioni</p>
                </div>
              </div>

              {/* Step List */}
              <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[#0a0a0a] border-b border-[#2a2a2a]">
                  <span className="text-[13px] font-medium text-[#fafafa]">Step del Funnel</span>
                </div>
                <div className="divide-y divide-[#2a2a2a]">
                  {preview.steps.map((step: any, index: number) => (
                    <div key={index} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[12px] font-bold text-[#7c5cff]">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#fafafa]">{step.name}</p>
                        <p className="text-[11px] text-[#666666] truncate">{step.url}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-[#00d4aa] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Connections */}
              <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[#0a0a0a] border-b border-[#2a2a2a]">
                  <span className="text-[13px] font-medium text-[#fafafa]">Connessioni</span>
                </div>
                <div className="divide-y divide-[#2a2a2a]">
                  {preview.connections.map((conn: any, index: number) => {
                    const sourceIdx = parseInt(conn.source.split('-')[1]) - 1;
                    const targetIdx = parseInt(conn.target.split('-')[1]) - 1;
                    const sourceName = preview.steps[sourceIdx]?.name || conn.source;
                    const targetName = preview.steps[targetIdx]?.name || conn.target;
                    return (
                      <div key={index} className="px-4 py-2.5 flex items-center gap-2 text-[12px]">
                        <span className="text-[#fafafa]">{sourceName}</span>
                        <span className="text-[#00d4aa]">→</span>
                        <span className="text-[#fafafa]">{targetName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#111111] border border-[#2a2a2a] text-[#fafafa] rounded-xl text-[14px] font-medium hover:bg-[#1a1a1a] transition-all"
            >
              Annulla
            </button>
            <button
              onClick={handleImport}
              disabled={!preview || !funnelName.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white px-4 py-3 rounded-xl text-[14px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Crea Funnel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
