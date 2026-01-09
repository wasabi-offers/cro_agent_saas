"use client";

import { useState } from "react";
import { Plus, X, Target, Users, TrendingUp } from "lucide-react";

interface CreateFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFunnel: (funnelData: NewFunnelData) => void;
}

export interface NewFunnelData {
  name: string;
  description: string;
  steps: {
    name: string;
    page: string;
  }[];
}

export default function CreateFunnelModal({
  isOpen,
  onClose,
  onCreateFunnel,
}: CreateFunnelModalProps) {
  const [funnelName, setFunnelName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([
    { name: "Landing Page", page: "/" },
    { name: "Sign Up", page: "/signup" },
    { name: "Conversion", page: "/success" },
  ]);

  const addStep = () => {
    setSteps([...steps, { name: "", page: "" }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 2) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: "name" | "page", value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateFunnel({
      name: funnelName,
      description,
      steps,
    });
    // Reset form
    setFunnelName("");
    setDescription("");
    setSteps([
      { name: "Landing Page", page: "/" },
      { name: "Sign Up", page: "/signup" },
      { name: "Conversion", page: "/success" },
    ]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#2a2a2a] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[20px] font-semibold text-[#fafafa]">
                Create New Funnel
              </h2>
              <p className="text-[13px] text-[#888888]">
                Set up a new conversion funnel to track
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Funnel Name */}
          <div>
            <label className="block text-[13px] font-medium text-[#fafafa] mb-2">
              Funnel Name *
            </label>
            <input
              type="text"
              value={funnelName}
              onChange={(e) => setFunnelName(e.target.value)}
              placeholder="e.g., E-commerce Checkout, Lead Generation"
              required
              className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[14px] focus:outline-none focus:border-[#7c5cff] transition-all placeholder:text-[#666666]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-medium text-[#fafafa] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this funnel tracks..."
              rows={3}
              className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[14px] focus:outline-none focus:border-[#7c5cff] transition-all placeholder:text-[#666666] resize-none"
            />
          </div>

          {/* Funnel Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[13px] font-medium text-[#fafafa]">
                Funnel Steps *
              </label>
              <span className="text-[11px] text-[#666666]">
                Minimum 2 steps required
              </span>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-[#111111] border border-[#2a2a2a] rounded-xl"
                >
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                    <span className="text-[13px] font-bold text-[#7c5cff]">
                      {index + 1}
                    </span>
                  </div>

                  {/* Step Fields */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(index, "name", e.target.value)}
                        placeholder="Step name"
                        required
                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[13px] focus:outline-none focus:border-[#7c5cff] transition-all placeholder:text-[#666666]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={step.page}
                        onChange={(e) => updateStep(index, "page", e.target.value)}
                        placeholder="/page-url"
                        required
                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[13px] focus:outline-none focus:border-[#7c5cff] transition-all placeholder:text-[#666666]"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  {steps.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="flex-shrink-0 p-2 hover:bg-[#ff6b6b]/10 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-[#ff6b6b]" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Step Button */}
            <button
              type="button"
              onClick={addStep}
              className="w-full mt-3 px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#888888] text-[13px] font-medium hover:bg-[#1a1a1a] hover:text-[#fafafa] hover:border-[#7c5cff]/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#7c5cff] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-[#fafafa] font-medium mb-1">
                  How it works
                </p>
                <p className="text-[12px] text-[#888888] leading-relaxed">
                  After creating your funnel, we'll start tracking visitors through each step. You'll see conversion rates, drop-off points, and optimization opportunities in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#111111] border border-[#2a2a2a] text-[#fafafa] rounded-xl text-[14px] font-medium hover:bg-[#1a1a1a] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white px-4 py-3 rounded-xl text-[14px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              Create Funnel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
