"use client";

import { useState } from "react";
import { CROTableRow } from "@/lib/saved-items";
import { TrendingUp, AlertCircle, Lightbulb, Target, Calendar, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Eye, Wrench } from "lucide-react";

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
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
      case 'completed':
        return 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/30';
      default:
        return 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20';
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'win':
        return 'text-[#06B6D4] bg-[#06B6D4]/10';
      case 'loss':
        return 'text-[#EF4444] bg-[#EF4444]/10';
      default:
        return 'text-[#f59e0b] bg-[#f59e0b]/10';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30';
      case 'medium':
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
      case 'low':
        return 'bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/30';
      default:
        return 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#6366F1]/30 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[22px] font-bold text-[#0F172A]">
              CRO Core Decision Table (AI-Generated)
            </h3>
            <p className="text-[15px] text-[#64748B] mt-1">
              Data-driven optimization opportunities with predicted impact
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {rows.map((row) => {
          const isExpanded = expandedRows.includes(row.id);
          
          return (
            <div
              key={row.id}
              className="bg-white border border-[#CBD5E1] rounded-2xl overflow-hidden hover:border-[#6366F1]/50 hover:shadow-lg transition-[border-color,box-shadow] duration-200 relative"
            >
              {/* Card Header - Always Visible */}
              <div
                className="p-6 cursor-pointer bg-white"
                onClick={() => toggleRow(row.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center">
                    <span className="text-[18px] font-bold text-white">
                      {row.id}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Metric Observed */}
                    <h4 className="text-[16px] font-bold text-[#0F172A] mb-2 leading-relaxed">
                      {row.metricObserved}
                    </h4>

                    {/* Quick Info Row */}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      {/* Expected Lift */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-[#06B6D4]" />
                        <span className="text-[15px] font-bold text-[#06B6D4]">
                          {row.expectedLift}
                        </span>
                      </div>

                      {/* Status */}
                      <div className={`px-3 py-1.5 rounded-lg border text-[13px] font-bold uppercase ${getStatusColor(row.runTest.status)}`}>
                        {row.runTest.status === 'not-started' && '▶ Not Started'}
                        {row.runTest.status === 'running' && '⏱ Running'}
                        {row.runTest.status === 'completed' && '✓ Completed'}
                      </div>

                      {/* Priority */}
                      {row.priority && (
                        <div className={`px-3 py-1.5 rounded-lg border text-[13px] font-bold uppercase ${getPriorityColor(row.priority)}`}>
                          {row.priority} Priority
                        </div>
                      )}

                      {/* Test Title */}
                      <div className="text-[14px] font-semibold text-[#6366F1]">
                        {row.practicalTest.title}
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Icon */}
                  <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F8FAFC] transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#64748B]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#64748B]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#CBD5E1] bg-[#F8FAFC] p-6 space-y-6">
                  {/* What You See */}
                  {row.whatYouSee && (
                    <div className="bg-white rounded-xl p-4 border border-[#6366F1]/20">
                      <div className="flex items-start gap-3">
                        <Eye className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[14px] font-bold text-[#0F172A] mb-2">What You See</h5>
                          <p className="text-[15px] text-[#64748B] leading-relaxed">
                            {row.whatYouSee}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assumption */}
                  <div className="bg-white rounded-xl p-4 border border-[#06B6D4]/20">
                    <div className="flex items-start gap-3 mb-3">
                      <Lightbulb className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="text-[14px] font-bold text-[#0F172A] mb-2">Correct Assumption</h5>
                        <p className="text-[15px] text-[#64748B] leading-relaxed">
                          {row.correctAssumption}
                        </p>
                      </div>
                    </div>
                    {row.wrongAssumption && (
                      <div className="mt-4 pt-4 border-t border-[#EF4444]/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="text-[14px] font-bold text-[#EF4444] mb-2">Wrong Assumption</h5>
                            <p className="text-[15px] text-[#64748B] leading-relaxed">
                              {row.wrongAssumption}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Practical Test */}
                  <div className="bg-white rounded-xl p-4 border border-[#6366F1]/20">
                    <h5 className="text-[14px] font-bold text-[#0F172A] mb-4">{row.practicalTest.title}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#CBD5E1]">
                        <div className="text-[12px] text-[#64748B] uppercase font-bold mb-2">FROM:</div>
                        <div className="text-[15px] text-[#0F172A] leading-relaxed">
                          {row.practicalTest.from}
                        </div>
                      </div>
                      <div className="bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-lg p-4">
                        <div className="text-[12px] text-[#06B6D4] uppercase font-bold mb-2">TO:</div>
                        <div className="text-[15px] text-[#0F172A] leading-relaxed font-medium">
                          {row.practicalTest.to}
                        </div>
                      </div>
                    </div>
                    {row.practicalTest.details && row.practicalTest.details.length > 0 && (
                      <div className="mt-4 bg-[#fff3e0] border border-[#ffb74d] rounded-xl p-5 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3">
                          <Wrench className="w-4 h-4 text-[#e65100] animate-pulse" />
                          <h6 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wide">Implementation Details</h6>
                          <span className="ml-auto flex items-center gap-1.5 bg-[#ff9800] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                            Action Required
                          </span>
                        </div>
                        <div className="space-y-2">
                          {row.practicalTest.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-[#e65100] rounded-full mt-2 flex-shrink-0" />
                              <span className="text-[15px] text-[#0F172A] leading-relaxed font-medium">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* KPI to Observe */}
                  <div className="bg-white rounded-xl p-4 border border-[#6366F1]/20">
                    <h5 className="text-[14px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#6366F1]" />
                      KPI to Observe
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {row.kpiToObserve.map((kpi, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg text-[14px] text-[#6366F1] font-medium"
                        >
                          {kpi}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Run Test & Experiment Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Run Test */}
                    <div className="bg-white rounded-xl p-4 border border-[#CBD5E1]">
                      <h5 className="text-[14px] font-bold text-[#0F172A] mb-3">Test Status</h5>
                      <div className="space-y-2">
                        <div className={`px-3 py-2 rounded-lg border text-[14px] font-bold uppercase inline-block ${getStatusColor(row.runTest.status)}`}>
                          {row.runTest.status === 'not-started' && '▶ Not Started'}
                          {row.runTest.status === 'running' && '⏱ Running'}
                          {row.runTest.status === 'completed' && '✓ Completed'}
                        </div>
                        {row.runTest.startDate && (
                          <div className="flex items-center gap-2 text-[15px] text-[#64748B]">
                            <Calendar className="w-4 h-4" />
                            <span>{row.runTest.startDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Experiment Feedback */}
                    <div className="bg-white rounded-xl p-4 border border-[#CBD5E1]">
                      <h5 className="text-[14px] font-bold text-[#0F172A] mb-3">Experiment Results</h5>
                      {row.experimentFeedback ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[12px] text-[#64748B] mb-1">Control RPV:</div>
                              <div className="text-[16px] font-bold text-[#0F172A]">
                                {row.experimentFeedback.controlRPV || '___'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] text-[#64748B] mb-1">Variant RPV:</div>
                              <div className="text-[16px] font-bold text-[#0F172A]">
                                {row.experimentFeedback.variantRPV || '___'}
                              </div>
                            </div>
                          </div>
                          {row.experimentFeedback.result && (
                            <div className={`px-3 py-2 rounded-lg text-[14px] font-bold uppercase text-center ${getResultColor(row.experimentFeedback.result)}`}>
                              {row.experimentFeedback.result === 'win' && '✓ WIN'}
                              {row.experimentFeedback.result === 'loss' && '✗ LOSS'}
                              {row.experimentFeedback.result === 'inconclusive' && '~ INCONCLUSIVE'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[15px] text-[#64748B] italic">
                          No data yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="bg-gradient-to-br from-white to-[#F8FAFC] border border-[#6366F1]/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-[15px] text-[#64748B]">
            <span className="font-bold text-[#0F172A]">{rows.length}</span> optimization opportunities identified
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[14px]">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
              <span className="text-[#64748B]">High Priority</span>
            </div>
            <div className="flex items-center gap-2 text-[14px]">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
              <span className="text-[#64748B]">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2 text-[14px]">
              <div className="w-3 h-3 rounded-full bg-[#6366F1]"></div>
              <span className="text-[#64748B]">Low Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
