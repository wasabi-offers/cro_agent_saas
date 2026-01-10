'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { mockCampaigns, mockAnalytics } from '@/lib/mock-data';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Eye,
  Target
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import Link from 'next/link';

export default function AnalyticsPage() {
  // Filtra solo campagne lanciate con analytics
  const campaignsWithAnalytics = mockCampaigns.filter(
    c => (c.status === 'launched' || c.status === 'analyzing') && mockAnalytics[c.id]
  );

  // Calcola totali
  const totals = campaignsWithAnalytics.reduce((acc, campaign) => {
    const analytics = mockAnalytics[campaign.id] || [];
    analytics.forEach(a => {
      acc.impressions += a.impressions;
      acc.clicks += a.clicks;
      acc.conversions += a.conversions;
      acc.revenue += a.revenue || 0;
      acc.cost += a.cost || 0;
    });
    return acc;
  }, { impressions: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 });

  const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100).toFixed(2) : 0;
  const avgConversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks * 100).toFixed(2) : 0;
  const totalROI = totals.cost > 0 ? (((totals.revenue - totals.cost) / totals.cost) * 100).toFixed(0) : 0;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 mt-1">Performance delle campagne lanciate</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Impressions Totali</p>
                <Eye className="text-blue-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{totals.impressions.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">CTR Medio</p>
                <MousePointerClick className="text-green-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{avgCTR}%</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Conversion Rate</p>
                <Target className="text-purple-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{avgConversionRate}%</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">ROI Totale</p>
                <DollarSign className="text-yellow-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">+{totalROI}%</p>
            </div>
          </div>

          {/* Campaign Performance Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Performance per Campagna</h2>
            </div>

            {campaignsWithAnalytics.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 mb-4">Nessuna campagna lanciata con analytics disponibili</p>
                <Link
                  href="/campaigns"
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Visualizza tutte le campagne
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Campagna
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Canale
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Impressions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Click
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        CTR
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Conversioni
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Conv. Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        ROI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {campaignsWithAnalytics.map((campaign) => {
                      const analytics = mockAnalytics[campaign.id]?.[0];
                      if (!analytics) return null;

                      return (
                        <tr key={campaign.id} className="hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4">
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="text-white hover:text-primary-400 font-medium"
                            >
                              {campaign.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <ChannelBadge channel={campaign.channel} />
                          </td>
                          <td className="px-6 py-4 text-white">
                            {analytics.impressions.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {analytics.clicks.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{analytics.ctr}%</span>
                              {analytics.ctr && analytics.ctr > 3 ? (
                                <TrendingUp className="text-green-400" size={16} />
                              ) : (
                                <TrendingDown className="text-red-400" size={16} />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">
                            {analytics.conversions.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {analytics.conversion_rate}%
                          </td>
                          <td className="px-6 py-4">
                            <span className={analytics.roi && analytics.roi > 0 ? 'text-green-400' : 'text-red-400'}>
                              {analytics.roi ? `+${analytics.roi}%` : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Revenue Overview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6">
              <p className="text-green-100 text-sm mb-2">Revenue Totale</p>
              <p className="text-3xl font-bold text-white">€{totals.revenue.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-6">
              <p className="text-red-100 text-sm mb-2">Costo Totale</p>
              <p className="text-3xl font-bold text-white">€{totals.cost.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
              <p className="text-purple-100 text-sm mb-2">Profitto Netto</p>
              <p className="text-3xl font-bold text-white">
                €{(totals.revenue - totals.cost).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
