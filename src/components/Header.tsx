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
    <header className="flex items-center justify-between px-10 py-5 border-b border-[#1a1a1a]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-[15px]">
        {breadcrumb.map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <span
              className={
                index === breadcrumb.length - 1
                  ? "text-[#fafafa] font-medium"
                  : "text-[#555555] hover:text-[#888888] cursor-pointer transition-colors"
              }
            >
              {item}
            </span>
            {index < breadcrumb.length - 1 && (
              <ChevronRight className="w-4 h-4 text-[#444444]" />
            )}
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Action button */}
        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] hover:opacity-90 text-white text-[14px] font-medium rounded-[10px] transition-all shadow-lg shadow-purple-500/25"
          >
            <span className="text-[18px] font-light">+</span>
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}
