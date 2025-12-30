"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Package,
  GitBranch,
  Activity,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "E-mails", href: "/emails", icon: Mail },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
  { name: "Visual Flows", href: "/visual-flows", icon: GitBranch },
  { name: "My Products", href: "/products", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-[12px] flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="text-white font-bold text-base font-['Space_Grotesk']">E</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[#fafafa] text-[16px] leading-tight font-['Space_Grotesk']">Email</span>
          <span className="text-[12px] text-[#666666]">.ai</span>
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
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#fafafa]' : 'group-hover:text-[#fafafa]'}`} />
              <span className="text-[15px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
