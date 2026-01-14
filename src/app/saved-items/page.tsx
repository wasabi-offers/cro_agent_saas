"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  Target,
  FileText,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Calendar,
  Folder,
  Plus,
} from "lucide-react";
import {
  SavedFunnel,
  SavedLandingPage,
  Category,
  funnelStorage,
  landingPageStorage,
  categoryStorage,
} from "@/lib/saved-items";

export default function SavedItemsPage() {
  const [activeTab, setActiveTab] = useState<'funnels' | 'pages'>('funnels');
  const [funnels, setFunnels] = useState<SavedFunnel[]>([]);
  const [pages, setPages] = useState<SavedLandingPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFunnels(funnelStorage.getAll());
    setPages(landingPageStorage.getAll());
    setCategories(categoryStorage.getAll());
  };

  const handleDelete = (type: 'funnel' | 'page', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    if (type === 'funnel') {
      funnelStorage.delete(id);
    } else {
      landingPageStorage.delete(id);
    }
    loadData();
  };

  const filteredFunnels = funnels
    .filter(f => filterCategory === 'all' || f.categoryId === filterCategory)
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredPages = pages
    .filter(p => filterCategory === 'all' || p.categoryId === filterCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="min-h-screen bg-black">
      <Header title="Saved Items" breadcrumb={["Dashboard", "Saved Items"]} />

      <div className="p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#fafafa] mb-2">Saved Items</h1>
            <p className="text-[15px] text-[#888888]">
              Your saved funnels and landing pages with CRO analysis
            </p>
          </div>
          <Link
            href="/landing-analysis"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Analyze New Page
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('funnels')}
            className={`px-6 py-3 text-[14px] font-medium transition-all relative flex items-center gap-2 ${
              activeTab === 'funnels'
                ? 'text-[#fafafa]'
                : 'text-[#666666] hover:text-[#888888]'
            }`}
          >
            <Target className="w-4 h-4" />
            Funnels ({funnels.length})
            {activeTab === 'funnels' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-6 py-3 text-[14px] font-medium transition-all relative flex items-center gap-2 ${
              activeTab === 'pages'
                ? 'text-[#fafafa]'
                : 'text-[#666666] hover:text-[#888888]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Landing Pages ({pages.length})
            {activeTab === 'pages' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]" />
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-[#fafafa] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#666666]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-[#fafafa] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'funnels' ? (
          filteredFunnels.length === 0 ? (
            <div className="text-center py-20">
              <Target className="w-16 h-16 text-[#666666] mx-auto mb-4" />
              <p className="text-[16px] text-[#888888] mb-2">No funnels saved yet</p>
              <p className="text-[14px] text-[#666666]">
                Start analyzing funnels to save them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFunnels.map(funnel => {
                const category = getCategoryById(funnel.categoryId);
                return (
                  <div
                    key={funnel.id}
                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-[#7c5cff]/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-[18px] font-semibold text-[#fafafa] mb-2">
                          {funnel.name}
                        </h3>
                        {category && (
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-[12px] text-[#888888]">{category.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete('funnel', funnel.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ff6b6b]/10 text-[#ff6b6b] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-[12px] text-[#888888]">
                        <Calendar className="w-3.5 h-3.5" />
                        Saved {new Date(funnel.savedAt).toLocaleDateString()}
                      </div>
                      {funnel.url && (
                        <a
                          href={funnel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[12px] text-[#7c5cff] hover:text-[#a78bff] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View funnel
                        </a>
                      )}
                    </div>

                    {funnel.analysis && (
                      <div className="pt-4 border-t border-white/5">
                        <div className="text-[12px] text-[#00d4aa] font-medium">
                          ✓ Analysis available ({funnel.analysis.comparisonTable.length} opportunities)
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          filteredPages.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 text-[#666666] mx-auto mb-4" />
              <p className="text-[16px] text-[#888888] mb-2">No landing pages saved yet</p>
              <p className="text-[14px] text-[#666666]">
                Start analyzing pages to save them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPages.map(page => {
                const category = getCategoryById(page.categoryId);
                return (
                  <div
                    key={page.id}
                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-[#7c5cff]/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-[18px] font-semibold text-[#fafafa] mb-2">
                          {page.name}
                        </h3>
                        {category && (
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-[12px] text-[#888888]">{category.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete('page', page.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ff6b6b]/10 text-[#ff6b6b] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-[12px] text-[#888888]">
                        <Calendar className="w-3.5 h-3.5" />
                        Saved {new Date(page.savedAt).toLocaleDateString()}
                      </div>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[12px] text-[#7c5cff] hover:text-[#a78bff] transition-colors truncate"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{page.url}</span>
                      </a>
                    </div>

                    {page.analysis && (
                      <div className="pt-4 border-t border-white/5">
                        <div className="text-[12px] text-[#00d4aa] font-medium">
                          ✓ Analysis available ({page.analysis.comparisonTable.length} opportunities)
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
