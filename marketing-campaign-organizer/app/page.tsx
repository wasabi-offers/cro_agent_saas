'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import {
  FileEdit,
  CheckCircle,
  Rocket,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';
import { mockCampaigns } from '@/lib/mock-data';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';

export default function DashboardPage() {
  // Calcola statistiche
  const stats = {
    total: mockCampaigns.length,
    inEditing: mockCampaigns.filter(c => c.status === 'in_editing').length,
    inReview: mockCampaigns.filter(c => c.status === 'in_review').length,
    launched: mockCampaigns.filter(c => c.status === 'launched' || c.status === 'analyzing').length,
  };

  // Campagne recenti (ultime 5)
  const recentCampaigns = [...mockCampaigns]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Panoramica delle tue campagne marketing</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Campagne Totali"
              value={stats.total}
              icon={FileEdit}
              color="text-blue-400"
            />
            <StatsCard
              title="In Editing"
              value={stats.inEditing}
              icon={FileEdit}
              color="text-yellow-400"
            />
            <StatsCard
              title="In Review"
              value={stats.inReview}
              icon={CheckCircle}
              color="text-purple-400"
            />
            <StatsCard
              title="Lanciate"
              value={stats.launched}
              icon={Rocket}
              color="text-green-400"
            />
          </div>

          {/* Recent Campaigns */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Campagne Recenti</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Campagna
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Canale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Data Lancio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Creata da
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {recentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{campaign.title}</div>
                          <div className="text-sm text-gray-400 line-clamp-1">{campaign.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ChannelBadge channel={campaign.channel} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {campaign.launch_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-500" />
                            {format(new Date(campaign.launch_date), 'dd MMM yyyy', { locale: it })}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {campaign.created_by || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                        >
                          <Eye size={16} />
                          Visualizza
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/campaigns/new"
              className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 hover:from-primary-700 hover:to-primary-800 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <FileEdit className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Nuova Campagna</h3>
                  <p className="text-primary-100 text-sm">Inizia un nuovo progetto</p>
                </div>
              </div>
            </Link>

            <Link
              href="/reviews"
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-primary-600 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <CheckCircle className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Review Pendenti</h3>
                  <p className="text-gray-400 text-sm">{stats.inReview} da approvare</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-primary-600 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Vedi Analytics</h3>
                  <p className="text-gray-400 text-sm">Performance campagne</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
