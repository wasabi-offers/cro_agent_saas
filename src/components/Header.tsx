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
      className="flex items-center justify-between px-8 py-4 border-b"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px]">
        {breadcrumb.map((item, index) => (
          <div key={item} className="flex items-center gap-2">
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
              <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
            )}
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[14px] font-medium rounded-xl transition-all duration-150 shadow-sm hover:shadow-brand"
          >
            <span className="text-[16px] font-light">+</span>
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}
