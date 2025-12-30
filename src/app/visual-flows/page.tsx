"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Play,
  Mail,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowDown,
  Target,
} from "lucide-react";

interface Email {
  id: string;
  from_name: string;
  subject: string;
  text_body: string;
  created_at: string;
}

interface FlowStep {
  id: string;
  emailId: string;
  subject: string;
  stepNumber: number;
  purpose: string;
  triggerType: string;
  delayFromPrevious: string;
  textBody?: string;
}

interface EmailFlow {
  flowId: string;
  flowName: string;
  flowType: string;
  description: string;
  steps: FlowStep[];
}

interface SenderOption {
  name: string;
  count: number;
}

export default function VisualFlowsPage() {
  const [senders, setSenders] = useState<SenderOption[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>("");
  const [flows, setFlows] = useState<EmailFlow[]>([]);
  const [isLoadingSenders, setIsLoadingSenders] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    fetchSenders();
  }, []);

  const fetchSenders = async () => {
    setIsLoadingSenders(true);

    let allEmails: { from_name: string }[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("emails")
        .select("from_name")
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Error fetching senders:", error);
        break;
      }

      if (data && data.length > 0) {
        allEmails = [...allEmails, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    // Group by sender
    const senderCounts: Record<string, number> = {};
    allEmails.forEach((email) => {
      const name = email.from_name || "Unknown Sender";
      senderCounts[name] = (senderCounts[name] || 0) + 1;
    });

    const sortedSenders = Object.entries(senderCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setSenders(sortedSenders);
    setIsLoadingSenders(false);
  };

  const analyzeFlows = async () => {
    if (!selectedSender) return;

    setIsAnalyzing(true);
    setFlows([]);

    try {
      // Fetch emails for the selected sender
      const { data: emails, error } = await supabase
        .from("emails")
        .select("id, from_name, subject, text_body, created_at")
        .eq("from_name", selectedSender)
        .order("created_at", { ascending: true })
        .limit(50); // Limit for API performance

      if (error) {
        console.error("Error fetching emails:", error);
        return;
      }

      if (!emails || emails.length === 0) {
        alert("No emails found for this sender");
        return;
      }

      // Create a map of email id to text_body for quick lookup
      const emailTextMap: Record<string, string> = {};
      emails.forEach((email) => {
        emailTextMap[email.id] = email.text_body || "";
      });

      // Call the AI analysis API
      const response = await fetch("/api/analyze-flows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderName: selectedSender,
          emails: emails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add text_body to each flow step
        const flowsWithText = data.flows.map((flow: EmailFlow) => ({
          ...flow,
          steps: flow.steps.map((step: FlowStep) => ({
            ...step,
            textBody: emailTextMap[step.emailId] || "",
          })),
        }));
        
        setFlows(flowsWithText);
        // Auto-expand all flows
        setExpandedFlows(new Set(flowsWithText.map((f: EmailFlow) => f.flowId)));
      } else {
        alert("Analysis failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze flows");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleFlow = (flowId: string) => {
    setExpandedFlows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(flowId)) {
        newSet.delete(flowId);
      } else {
        newSet.add(flowId);
      }
      return newSet;
    });
  };

  const getFlowTypeColor = (flowType: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      onboarding: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
      welcome: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
      promotional: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
      newsletter: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
      abandoned: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
      reengagement: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
      transactional: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
      launch: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
      standalone: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
    };
    return colors[flowType.toLowerCase()] || colors.standalone;
  };

  const getTriggerIcon = (triggerType: string) => {
    if (triggerType.toLowerCase().includes("time") || triggerType.toLowerCase().includes("delay")) {
      return <Clock className="w-3.5 h-3.5" />;
    }
    if (triggerType.toLowerCase().includes("action") || triggerType.toLowerCase().includes("click")) {
      return <Zap className="w-3.5 h-3.5" />;
    }
    return <Play className="w-3.5 h-3.5" />;
  };

  return (
    <div className="min-h-screen bg-black">
      <Header title="Visual Flows" breadcrumb={["Dashboard", "Visual Flows"]} />

      <div className="p-10">
        {/* Sender Selection */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-[#7c5cff]" />
            <h2 className="text-[18px] font-semibold text-[#fafafa]">
              AI Flow Analysis
            </h2>
          </div>
          <p className="text-[13px] text-[#666666] mb-6">
            Select a sender to analyze their email patterns and visualize hypothetical marketing flows.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {isLoadingSenders ? (
              <div className="flex items-center gap-2 text-[#666666]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">Loading senders...</span>
              </div>
            ) : (
              <>
                <select
                  value={selectedSender}
                  onChange={(e) => setSelectedSender(e.target.value)}
                  className="flex-1 max-w-md bg-[#111111] border border-white/20 rounded-xl px-4 py-3 text-[14px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff] transition-colors cursor-pointer"
                >
                  <option value="">Select a sender...</option>
                  {senders.map((sender) => (
                    <option key={sender.name} value={sender.name}>
                      {sender.name} ({sender.count} emails)
                    </option>
                  ))}
                </select>

                <button
                  onClick={analyzeFlows}
                  disabled={!selectedSender || isAnalyzing}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Flows
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Flow Visualization */}
        {flows.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#fafafa]">
                Discovered Flows for "{selectedSender}"
              </h2>
              <span className="text-[13px] text-[#666666]">
                {flows.length} flow{flows.length !== 1 ? "s" : ""} identified
              </span>
            </div>

            {flows.map((flow) => {
              const isExpanded = expandedFlows.has(flow.flowId);
              const colors = getFlowTypeColor(flow.flowType);

              return (
                <div
                  key={flow.flowId}
                  className={`bg-[#0a0a0a] border ${colors.border} rounded-2xl overflow-hidden transition-all duration-300`}
                >
                  {/* Flow Header */}
                  <button
                    onClick={() => toggleFlow(flow.flowId)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                        <Target className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[16px] font-semibold text-[#fafafa]">
                            {flow.flowName}
                          </h3>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide ${colors.bg} ${colors.text}`}
                          >
                            {flow.flowType}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#666666] mt-1">
                          {flow.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-[#888888]">
                        {flow.steps.length} step{flow.steps.length !== 1 ? "s" : ""}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[#666666]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#666666]" />
                      )}
                    </div>
                  </button>

                  {/* Flow Steps */}
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="relative pl-8">
                        {/* Vertical Line */}
                        <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#7c5cff] via-[#7c5cff]/50 to-transparent" />

                        {flow.steps.map((step, index) => (
                          <div key={step.id} className="relative mb-4 last:mb-0">
                            {/* Step Node */}
                            <div
                              className={`absolute left-[-23px] w-8 h-8 rounded-full bg-[#111111] border-2 ${
                                index === 0
                                  ? "border-[#7c5cff] bg-[#7c5cff]/20"
                                  : "border-[#333333]"
                              } flex items-center justify-center z-10`}
                            >
                              <Mail
                                className={`w-3.5 h-3.5 ${
                                  index === 0 ? "text-[#7c5cff]" : "text-[#666666]"
                                }`}
                              />
                            </div>

                            {/* Step Card */}
                            <div
                              className={`ml-4 bg-[#111111] border ${
                                expandedStep === step.id
                                  ? "border-[#7c5cff]/50"
                                  : "border-white/10"
                              } rounded-xl p-4 cursor-pointer hover:border-[#7c5cff]/30 transition-all`}
                              onClick={() =>
                                setExpandedStep(
                                  expandedStep === step.id ? null : step.id
                                )
                              }
                            >
<div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[11px] font-bold text-[#7c5cff] uppercase tracking-wider">
                                                      Step {step.stepNumber}
                                                    </span>
                                                    <span className="text-[#333333]">•</span>
                                                    <div className="flex items-center gap-1 text-[11px] text-[#666666]">
                                                      {getTriggerIcon(step.triggerType)}
                                                      <span>{step.triggerType}</span>
                                                    </div>
                                                    <span className="text-[#333333]">•</span>
                                                    <span className="text-[11px] text-[#555555]">
                                                      {expandedStep === step.id ? "Click to collapse" : "Click to view content"}
                                                    </span>
                                                  </div>
                                                  <h4 className="text-[14px] font-medium text-[#fafafa] leading-relaxed">
                                                    {step.subject}
                                                  </h4>
{expandedStep === step.id && (
                                                    <div className="mt-3 pt-3 border-t border-white/10">
                                                      <p className="text-[13px] text-[#888888]">
                                                        <span className="text-[#666666]">Purpose: </span>
                                                        {step.purpose}
                                                      </p>
                                                      {step.delayFromPrevious &&
                                                        step.delayFromPrevious !== "none" && (
                                                          <p className="text-[13px] text-[#888888] mt-1">
                                                            <span className="text-[#666666]">
                                                              Delay from previous:{" "}
                                                            </span>
                                                            {step.delayFromPrevious}
                                                          </p>
                                                        )}
                                                      {step.textBody && (
                                                        <div className="mt-4">
                                                          <p className="text-[12px] font-semibold text-[#7c5cff] uppercase tracking-wide mb-2">
                                                            Email Content
                                                          </p>
                                                          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                                            <p className="text-[13px] text-[#aaaaaa] whitespace-pre-wrap leading-relaxed">
                                                              {step.textBody}
                                                            </p>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Arrow Between Steps */}
                            {index < flow.steps.length - 1 && (
                              <div className="absolute left-[-7px] bottom-[-12px] z-20">
                                <ArrowDown className="w-4 h-4 text-[#7c5cff]/50" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isAnalyzing && flows.length === 0 && selectedSender && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#333333]" />
            </div>
            <p className="text-[#666666] text-[15px]">
              Click "Analyze Flows" to discover email patterns
            </p>
          </div>
        )}

        {!selectedSender && !isLoadingSenders && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#333333]" />
            </div>
            <p className="text-[#666666] text-[15px]">
              Select a sender to start analyzing their email flows
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

