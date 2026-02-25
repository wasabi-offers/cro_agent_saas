"use client";

import { ChevronRight } from "lucide-react";

interface HeaderProps {
  title: string;
  breadcrumb?: string[];
  actionLabel?: string;
  onAction?: () => void;
}

export default function Header({
  title,
  breadcrumb = ["Dashboard"],
  actionLabel,
  onAction,
}: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-10 py-5 border-b"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-[15px]">
        {breadcrumb.map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <span
              style={{
                color: index === breadcrumb.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: index === breadcrumb.length - 1 ? 500 : 400,
                cursor: index < breadcrumb.length - 1 ? "pointer" : "default",
              }}
            >
              {item}
            </span>
            {index < breadcrumb.length - 1 && (
              <ChevronRight className="w-4 h-4" style={{ color: "var(--text-faint)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-br from-[#F97316] to-[#C2410C] hover:opacity-90 text-white text-[14px] font-medium rounded-[10px] transition-all shadow-lg shadow-orange-500/25"
          >
            <span className="text-[18px] font-light">+</span>
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}
