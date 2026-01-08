"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRangePickerProps {
  value: { start: string; end: string };
  onChange: (range: { start: string; end: string }) => void;
  className?: string;
}

export default function DateRangePicker({ value, onChange, className = "" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState(value);

  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 14 days", days: 14 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const range = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };

    setTempRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[14px] hover:border-[#7c5cff] transition-all"
      >
        <Calendar className="w-4 h-4 text-[#7c5cff]" />
        <span>
          {formatDate(value.start)} - {formatDate(value.end)}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#888888] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-[400px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4">
              <h3 className="text-[14px] font-semibold text-[#fafafa] mb-3">Select Date Range</h3>

              {/* Presets */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset.days)}
                    className="px-4 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[13px] text-[#888888] hover:border-[#7c5cff] hover:text-[#fafafa] transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Range */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-[12px] text-[#888888] mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={tempRange.start}
                    onChange={(e) => setTempRange({ ...tempRange, start: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[13px] focus:outline-none focus:border-[#7c5cff]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#888888] mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={tempRange.end}
                    onChange={(e) => setTempRange({ ...tempRange, end: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[13px] focus:outline-none focus:border-[#7c5cff]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[13px] text-[#888888] hover:text-[#fafafa] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-lg text-[13px] font-medium hover:shadow-lg transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
