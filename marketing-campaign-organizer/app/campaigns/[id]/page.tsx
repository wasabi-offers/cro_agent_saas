'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import {
  ArrowLeft,
  Edit,
  Save,
  Sparkles,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { mockCampaigns, mockCampaignCopy, mockReviews } from '@/lib/mock-data';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const campaign = mockCampaigns.find(c => c.id === campaignId);
  const copies = mockCampaignCopy[campaignId] || [];
  const reviews = mockReviews.filter(r => r.campaign_id === campaignId);

  const [editingCopyId, setEditingCopyId] = useState<string | null>(null);
  const [copyContent, setCopyContent] = useState<Record<string, string>>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!campaign) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Campagna non trovata</h2>
            <Link href="/" className="text-primary-400 hover:text-primary-300">
              Torna alla dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleEditCopy = (copyId: string, content: string) => {
    setEditingCopyId(copyId);
    setCopyContent({ ...copyContent, [copyId]: content });
  };

  const handleSaveCopy = (copyId: string) => {
    // Qui chiameresti l'API per salvare
    console.log('Saving copy:', copyId, copyContent[copyId]);
    setEditingCopyId(null);
  };

  const handleGenerateAI = async (copyType: string) => {
    setIsGeneratingAI(true);
    // Simulazione chiamata AI
    setTimeout(() => {
      setIsGeneratingAI(false);
      alert('Funzionalità AI in arrivo! Verrà integrato Claude per generare copy ottimizzato.');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="px-8 py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Torna alla dashboard
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{campaign.title}</h1>
                <p className="text-gray-400 mt-1">{campaign.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={campaign.status} />
                <ChannelBadge channel={campaign.channel} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Copy Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Info */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Informazioni Campagna</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Target Audience</p>
                    <p className="text-white mt-1">{campaign.target_audience || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Obiettivi</p>
                    <p className="text-white mt-1">{campaign.objectives || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Data Lancio</p>
                    <p className="text-white mt-1">
                      {campaign.launch_date
                        ? format(new Date(campaign.launch_date), 'dd MMMM yyyy', { locale: it })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Creata da</p>
                    <p className="text-white mt-1">{campaign.created_by || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Copy Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Copy & Contenuti</h2>
                  <button
                    onClick={() => handleGenerateAI('general')}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    <Sparkles size={18} />
                    {isGeneratingAI ? 'Generando...' : 'Genera con AI'}
                  </button>
                </div>

                {copies.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                    <p className="text-gray-400 mb-4">Nessun contenuto ancora. Inizia a scrivere!</p>
                    <button
                      onClick={() => handleGenerateAI('new')}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Crea il primo copy
                    </button>
                  </div>
                ) : (
                  copies.map((copy) => {
                    const isEditing = editingCopyId === copy.id;
                    const currentContent = copyContent[copy.id] || copy.content;

                    return (
                      <div key={copy.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-white capitalize">
                              {copy.copy_type.replace('_', ' ')}
                            </h3>
                            <span className="text-xs text-gray-500">v{copy.version}</span>
                            {copy.ai_generated && (
                              <span className="inline-flex items-center gap-1 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                <Sparkles size={12} />
                                AI Generated
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveCopy(copy.id)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                              >
                                <Save size={16} />
                                Salva
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditCopy(copy.id, copy.content)}
                                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                              >
                                <Edit size={16} />
                                Modifica
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={currentContent}
                            onChange={(e) => setCopyContent({ ...copyContent, [copy.id]: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-white min-h-[200px] focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="bg-gray-900 rounded-lg p-4 whitespace-pre-wrap text-gray-200">
                            {copy.content}
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                          <span>Tone: {copy.tone_of_voice || 'Non specificato'}</span>
                          <span>•</span>
                          <span>Lingua: {copy.language.toUpperCase()}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(copy.created_at), 'dd MMM yyyy HH:mm', { locale: it })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sidebar - Reviews & Activity */}
            <div className="space-y-6">
              {/* Reviews */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={20} className="text-primary-400" />
                  <h3 className="text-lg font-semibold text-white">Review & Feedback</h3>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nessuna review ancora</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-t border-gray-700 pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-medium">{review.reviewer_name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(review.created_at), 'dd MMM yyyy HH:mm', { locale: it })}
                            </p>
                          </div>
                          {review.status === 'approved' ? (
                            <ThumbsUp size={18} className="text-green-400" />
                          ) : review.status === 'rejected' ? (
                            <ThumbsDown size={18} className="text-red-400" />
                          ) : (
                            <Clock size={18} className="text-yellow-400" />
                          )}
                        </div>
                        {review.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating! ? 'text-yellow-400' : 'text-gray-600'}>
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-300">{review.comments}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Aggiungi Review
                </button>
              </div>

              {/* KPIs */}
              {campaign.kpis && Object.keys(campaign.kpis).length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye size={20} className="text-green-400" />
                    <h3 className="text-lg font-semibold text-white">KPI Target</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(campaign.kpis).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Actions */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Azioni Workflow</h3>
                <div className="space-y-2">
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Invia a Review
                  </button>
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Approva e Lancia
                  </button>
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Vedi Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
