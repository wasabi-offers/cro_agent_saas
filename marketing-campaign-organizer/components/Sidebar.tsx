'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileEdit,
  CheckCircle,
  Rocket,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tutte le Campagne', href: '/campaigns', icon: FileEdit },
  { name: 'In Review', href: '/reviews', icon: CheckCircle },
  { name: 'Lanciate', href: '/launched', icon: Rocket },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Impostazioni', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 border-r border-gray-800">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">
          Marketing Organizer
        </h1>
      </div>

      {/* New Campaign Button */}
      <div className="p-4">
        <Link
          href="/campaigns/new"
          className="flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
        >
          <Plus size={20} />
          Nuova Campagna
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                ${isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <div className="text-xs text-gray-500">
          v1.0.0 - Marketing Campaign Organizer
        </div>
      </div>
    </div>
  );
}
