"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";

interface DeviceFilterProps {
  value: "all" | "desktop" | "mobile";
  onChange: (device: "all" | "desktop" | "mobile") => void;
  className?: string;
}

export default function DeviceFilter({ value, onChange, className = "" }: DeviceFilterProps) {
  const devices = [
    { id: "all" as const, label: "All Devices", icon: Tablet },
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
    { id: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {devices.map((device) => {
        const Icon = device.icon;
        const isActive = value === device.id;

        return (
          <button
            key={device.id}
            onClick={() => onChange(device.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
              isActive
                ? "bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20"
                : "bg-[#F8FAFC] text-[#94A3B8] border border-[#CBD5E1] hover:border-[#6366F1]/50 hover:text-[#0F172A]"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{device.label}</span>
          </button>
        );
      })}
    </div>
  );
}
