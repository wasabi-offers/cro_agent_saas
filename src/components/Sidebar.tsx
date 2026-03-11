"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";
import type { User } from "@supabase/supabase-js";
import type { TranslationKey } from "@/lib/i18n";
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
  Languages,
} from "lucide-react";

const menuItems: { nameKey: TranslationKey; href: string; icon: typeof LayoutDashboard }[] = [
  { nameKey: "sidebar.dashboard", href: "/", icon: LayoutDashboard },
  { nameKey: "sidebar.exploreAi", href: "/explore-ai", icon: Brain },
  { nameKey: "sidebar.attribution", href: "/attribution", icon: Target },
  { nameKey: "sidebar.analytics", href: "/analytics", icon: BarChart3 },
  { nameKey: "sidebar.abTests", href: "/ab-tests", icon: FlaskConical },
  { nameKey: "sidebar.heatmaps", href: "/heatmaps", icon: MousePointerClick },
  { nameKey: "sidebar.projects", href: "/products", icon: Folder },
  { nameKey: "sidebar.landingAnalysis", href: "/landing-analysis", icon: FileSearch },
  { nameKey: "sidebar.competitorMonitoring", href: "/competitor-monitoring", icon: Globe },
  { nameKey: "sidebar.archive", href: "/saved-items", icon: Archive },
  { nameKey: "sidebar.dataSources", href: "/data-sources", icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

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
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-50 border-r"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <TrendingUp className="w-[18px] h-[18px] text-white" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[15px] leading-tight tracking-tight" style={{ color: "var(--text-primary)" }}>
            CRO Agent
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Conversion Optimizer
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
              style={{
                backgroundColor: isActive ? "var(--bg-sidebar-active)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
              }}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-[#6366F1]" : "group-hover:text-[#6366F1]"}`}
                strokeWidth={1.5}
              />
              <span className="text-[14px] font-medium">{t(item.nameKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme + Language + User */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
        {/* Day / Night toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-1.5 transition-all duration-150"
          style={{
            backgroundColor: "var(--bg-sidebar-active)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-4 h-4 text-[#818CF8]" strokeWidth={1.5} />
            ) : (
              <Sun className="w-4 h-4 text-[#6366F1]" strokeWidth={1.5} />
            )}
            <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {isDark ? t("sidebar.darkMode") : t("sidebar.lightMode")}
            </span>
          </div>
          <div
            className="relative w-9 h-5 rounded-full transition-colors duration-150"
            style={{ backgroundColor: isDark ? "#6366F1" : "#CBD5E1" }}
          >
            <div
              className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150"
              style={{ transform: isDark ? "translateX(18px)" : "translateX(2px)" }}
            />
          </div>
        </button>

        {/* Language toggle */}
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2"
          style={{
            backgroundColor: "var(--bg-sidebar-active)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Languages className="w-4 h-4 text-[#06B6D4]" strokeWidth={1.5} />
            <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {t("common.language")}
            </span>
          </div>
          <div className="flex items-center gap-0.5 bg-[var(--bg-tertiary)] rounded-lg p-0.5">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                lang === "en"
                  ? "bg-[#6366F1] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("it")}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                lang === "it"
                  ? "bg-[#6366F1] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              IT
            </button>
          </div>
        </div>

        {/* User card */}
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: "var(--bg-sidebar-active)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {user?.email || t("sidebar.loading")}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{t("sidebar.online")}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-[13px] font-medium rounded-lg transition-all duration-150"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#EF4444";
              e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-faint)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("sidebar.signOut")}
          </button>
        </div>
      </div>
    </aside>
  );
}
