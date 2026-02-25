"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useTheme } from "@/components/ThemeProvider";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  BarChart3,
  FlaskConical,
  MousePointerClick,
  Database,
  TrendingUp,
  FileSearch,
  Brain,
  Folder,
  Archive,
  Target,
  Globe,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Explore AI", href: "/explore-ai", icon: Brain },
  { name: "Attribution", href: "/attribution", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "A/B Tests", href: "/ab-tests", icon: FlaskConical },
  { name: "Heatmaps", href: "/heatmaps", icon: MousePointerClick },
  { name: "Projects", href: "/products", icon: Folder },
  { name: "Landing Analysis", href: "/landing-analysis", icon: FileSearch },
  { name: "Competitor Monitoring", href: "/competitor-monitoring", icon: Globe },
  { name: "Archivio", href: "/saved-items", icon: Archive },
  { name: "Data Sources", href: "/data-sources", icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isDark = theme === "dark";

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[280px] flex flex-col z-50 border-r"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#F97316] to-[#3b82f6] rounded-[12px] flex items-center justify-center shadow-lg shadow-orange-500/20">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[16px] leading-tight" style={{ color: "var(--text-primary)" }}>
            CRO Agent
          </span>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Conversion Optimizer
          </span>
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
              className="flex justify-start items-center gap-4 px-[15px] py-[15px] rounded-[12px] transition-all duration-200 group"
              style={{
                backgroundColor: isActive ? "var(--bg-sidebar-active)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
              }}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#F97316]" : "group-hover:text-[#F97316]"}`} />
              <span className="text-[15px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle + User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
        {/* Day / Night toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-3 transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-sidebar-active)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="w-4 h-4 text-[#F97316]" />
            ) : (
              <Sun className="w-4 h-4 text-[#ff9500]" />
            )}
            <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {isDark ? "Dark Mode" : "Light Mode"}
            </span>
          </div>
          {/* Pill toggle */}
          <div
            className="relative w-10 h-[22px] rounded-full transition-colors duration-300"
            style={{ backgroundColor: isDark ? "#F97316" : "#e0e0e0" }}
          >
            <div
              className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300"
              style={{ transform: isDark ? "translateX(21px)" : "translateX(3px)" }}
            />
          </div>
        </button>

        {/* User card */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--bg-sidebar-active)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F97316] to-[#3b82f6] rounded-lg flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {user?.email || "Loading..."}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-[13px] font-medium rounded-lg transition-all"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ff6b6b";
              e.currentTarget.style.backgroundColor = isDark ? "rgba(255,107,107,0.1)" : "rgba(255,107,107,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-faint)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
