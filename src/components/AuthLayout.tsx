"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AIChatAssistant from "@/components/AIChatAssistant";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-[var(--bg-primary)]">{children}</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="pl-[280px]">{children}</main>
      <AIChatAssistant />
    </div>
  );
}
