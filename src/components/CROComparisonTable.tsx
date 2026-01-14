"use client";

import { useState } from "react";
import { CROTableRow } from "@/lib/saved-items";
import { TrendingUp, AlertCircle, Lightbulb, Target, Calendar, CheckCircle2 } from "lucide-react";

interface CROComparisonTableProps {
  rows: CROTableRow[];
  onUpdateTest?: (rowId: number, data: Partial<CROTableRow>) => void;
}

export default function CROComparisonTable({ rows, onUpdateTest }: CROComparisonTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (rowId: number) => {
    setExpandedRows(prev =>
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30';
      case 'completed':
        return 'bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/30';
      default:
        return 'bg-[#666666]/10 text-[#666666] border-[#666666]/30';
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'win':
        return 'text-[#00d4aa]';
      case 'loss':
        return 'text-[#ff6b6b]';
      default:
        return 'text-[#f59e0b]';
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1a1a1a] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[#fafafa]">
              CRO Core Decision Table (AI-Generated)
            </h3>
            <p className="text-[13px] text-[#888888] mt-0.5">
              Data-driven optimization opportunities with predicted impact
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider w-8">#</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider min-w-[180px]">Metric Observed</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider min-w-[200px]">Assumption (What to do & WHY)</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider min-w-[250px]">Practical A/B Test (Exact Change)</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider min-w-[120px]">Expected Lift</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider min-w-[140px]">KPI to Observe</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider min-w-[140px]">Run Test (Date/Status)</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#888888] uppercase tracking-wider min-w-[180px]">Experiment Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-[#111111]/50 transition-colors cursor-pointer"
                onClick={() => toggleRow(row.id)}
              >
                {/* # */}
                <td className="px-4 py-4 text-[13px] text-[#fafafa] font-bold">
                  {row.id}
                </td>

                {/* Metric Observed */}
                <td className="px-4 py-4">
                  <div className="text-[13px] text-[#fafafa] font-medium leading-relaxed">
                    {row.metricObserved}
                  </div>
                  {expandedRows.includes(row.id) && row.whatYouSee && (
                    <div className="mt-2 text-[12px] text-[#888888] leading-relaxed">
                      <span className="font-semibold text-[#7c5cff]">What you see:</span> {row.whatYouSee}
                    </div>
                  )}
                </td>

                {/* Assumption */}
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
                      <div className="text-[13px] text-[#fafafa] leading-relaxed">
                        {row.correctAssumption}
                      </div>
                    </div>
                    {expandedRows.includes(row.id) && row.wrongAssumption && (
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#1a1a1a]">
                        <AlertCircle className="w-4 h-4 text-[#ff6b6b] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-bold text-[#ff6b6b] uppercase">Wrong assumption:</span>
                          <p className="text-[12px] text-[#888888] mt-1">{row.wrongAssumption}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </td>

                {/* Practical Test */}
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="text-[13px] font-semibold text-[#7c5cff]">
                      {row.practicalTest.title}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-[#111111] rounded-lg p-2">
                        <div className="text-[10px] text-[#666666] uppercase font-bold mb-1">FROM:</div>
                        <div className="text-[12px] text-[#fafafa]">{row.practicalTest.from}</div>
                      </div>
                      <div className="bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-lg p-2">
                        <div className="text-[10px] text-[#00d4aa] uppercase font-bold mb-1">TO:</div>
                        <div className="text-[12px] text-[#fafafa]">{row.practicalTest.to}</div>
                      </div>
                    </div>
                    {expandedRows.includes(row.id) && row.practicalTest.details && (
                      <div className="mt-2 space-y-1">
                        {row.practicalTest.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-[#888888]">
                            <div className="w-1 h-1 bg-[#7c5cff] rounded-full mt-1.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Expected Lift */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00d4aa]" />
                    <span className="text-[14px] font-bold text-[#00d4aa]">
                      {row.expectedLift}
                    </span>
                  </div>
                </td>

                {/* KPI to Observe */}
                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    {row.kpiToObserve.map((kpi, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-[#7c5cff]" />
                        <span className="text-[12px] text-[#fafafa]">{kpi}</span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Run Test */}
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className={`px-2 py-1 rounded-lg border text-[11px] font-bold uppercase inline-block ${getStatusColor(row.runTest.status)}`}>
                      {row.runTest.status === 'not-started' && '▶ Not Started'}
                      {row.runTest.status === 'running' && '⏱ Running'}
                      {row.runTest.status === 'completed' && '✓ Completed'}
                    </div>
                    {row.runTest.startDate && (
                      <div className="flex items-center gap-2 text-[12px] text-[#888888]">
                        <Calendar className="w-3 h-3" />
                        <span>{row.runTest.startDate}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Experiment Feedback */}
                <td className="px-4 py-4">
                  {row.experimentFeedback ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-[#666666]">Control RPV:</div>
                          <div className="text-[#fafafa] font-semibold">
                            {row.experimentFeedback.controlRPV || '___'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#666666]">Variant RPV:</div>
                          <div className="text-[#fafafa] font-semibold">
                            {row.experimentFeedback.variantRPV || '___'}
                          </div>
                        </div>
                      </div>
                      {row.experimentFeedback.result && (
                        <div className={`text-[12px] font-bold uppercase ${getResultColor(row.experimentFeedback.result)}`}>
                          {row.experimentFeedback.result === 'win' && '✓ WIN'}
                          {row.experimentFeedback.result === 'loss' && '✗ LOSS'}
                          {row.experimentFeedback.result === 'inconclusive' && '~ INCONCLUSIVE'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[12px] text-[#666666] italic">
                      No data yet
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="bg-[#111111] border-t border-[#1a1a1a] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-[#888888]">
            <span className="font-semibold text-[#fafafa]">{rows.length}</span> optimization opportunities identified
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-3 h-3 rounded-full bg-[#00d4aa]"></div>
              <span className="text-[#888888]">High Priority</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
              <span className="text-[#888888]">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-3 h-3 rounded-full bg-[#7c5cff]"></div>
              <span className="text-[#888888]">Low Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
