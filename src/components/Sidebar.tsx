"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  FlaskConical,
  MousePointerClick,
  Database,
  TrendingUp,
  FileSearch,
  Brain,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Explore AI", href: "/explore-ai", icon: Brain },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "A/B Tests", href: "/ab-tests", icon: FlaskConical },
  { name: "Heatmaps", href: "/heatmaps", icon: MousePointerClick },
  { name: "Funnels", href: "/funnels", icon: TrendingUp },
  { name: "Landing Analysis", href: "/landing-analysis", icon: FileSearch },
  { name: "Data Sources", href: "/data-sources", icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-[12px] flex items-center justify-center shadow-lg shadow-purple-500/20">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[#fafafa] text-[16px] leading-tight font-['Space_Grotesk']">CRO Agent</span>
          <span className="text-[12px] text-[#666666]">Conversion Optimizer</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex justify-start items-center gap-4 px-[15px] py-[15px] rounded-[12px] transition-all duration-200 group ${
                isActive
                  ? "bg-[#151515] text-[#fafafa]"
                  : "text-[#888888] hover:bg-[#121212] hover:text-[#fafafa]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#7c5cff]' : 'group-hover:text-[#fafafa]'}`} />
              <span className="text-[15px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sync Status */}
      <div className="px-4 py-4 border-t border-[#1a1a1a]">
        <div className="bg-[#111111] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
            <span className="text-[12px] text-[#888888]">All sources synced</span>
          </div>
          <p className="text-[11px] text-[#555555]">
            Last sync: 2 hours ago
          </p>
        </div>
      </div>
    </aside>
  );
}
