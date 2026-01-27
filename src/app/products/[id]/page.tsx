"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  ChevronDown,
  Trash2,
  RefreshCw,
  Folder,
  Power,
  BarChart3,
  Activity,
  TrendingDown,
} from "lucide-react";
import FunnelBuilder from "@/components/FunnelBuilder";
import { ConversionFunnel, createFunnel, deleteFunnel } from "@/lib/supabase-funnels";

interface Product {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  funnelCount: number;
}

export default function ProductFunnelsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "conversion" | "visitors">("conversion");
  const [showBuilder, setShowBuilder] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);

    try {
      // Load product details
      const productResponse = await fetch(`/api/products/${productId}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (productResponse.ok) {
        const productData = await productResponse.json();
        if (productData.success) {
          setProduct(productData.product);
        }
      }

      // Load funnels for this product
      const timestamp = Date.now();
      const funnelsResponse = await fetch(
        `/api/products/${productId}/funnels?_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }
      );

      if (funnelsResponse.ok) {
        const funnelsData = await funnelsResponse.json();
        if (funnelsData.success) {
          setFunnels(funnelsData.funnels || []);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();

    // Auto-refresh every 3 seconds for real-time data
    const interval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleSaveFunnel = async (funnel: { name: string; steps: any[]; connections?: any[] }) => {
    // Add product_id to funnel
    const funnelWithProduct = {
      ...funnel,
      product_id: productId,
    };

    const newFunnel = await createFunnel(funnelWithProduct);

    if (newFunnel) {
      setFunnels([newFunnel, ...funnels]);
      setShowBuilder(false);
      alert('✅ Funnel creato con successo!');
    } else {
      // If Supabase not configured, still add locally
      const localFunnel: ConversionFunnel = {
        id: `funnel_${Date.now()}`,
        name: funnel.name,
        steps: funnel.steps,
        connections: funnel.connections,
        conversionRate: funnel.steps[0].visitors > 0
          ? (funnel.steps[funnel.steps.length - 1].visitors / funnel.steps[0].visitors) * 100
          : 0,
      };
      setFunnels([localFunnel, ...funnels]);
      setShowBuilder(false);
    }
  };

  const handleDeleteFunnel = async (funnelId: string, funnelName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il funnel "${funnelName}"? Questa azione non può essere annullata.`)) {
      return;
    }

    const success = await deleteFunnel(funnelId);

    if (success) {
      setFunnels(funnels.filter(f => f.id !== funnelId));
      alert('✅ Funnel eliminato con successo!');
    } else {
      setFunnels(funnels.filter(f => f.id !== funnelId));
    }
  };

  const handleToggleActive = async (funnelId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/funnels/${funnelId}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        setFunnels(funnels.map(f =>
          f.id === funnelId ? { ...f, is_active: !currentStatus } : f
        ));
      }
    } catch (error) {
      console.error('Error toggling funnel active status:', error);
    }
  };

  const filteredFunnels = funnels
    .filter((funnel) =>
      funnel.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "conversion":
          return b.conversionRate - a.conversionRate;
        case "visitors":
          return b.steps[0].visitors - a.steps[0].visitors;
        default:
          return 0;
      }
    });

  // Filter active funnels for macro analysis
  const activeFunnels = funnels.filter(f => f.is_active !== false);
  const inactiveFunnels = funnels.filter(f => f.is_active === false);

  // Stats only for active funnels
  const totalVisitors = activeFunnels.reduce((sum, f) => sum + f.steps[0].visitors, 0);
  const totalConversions = activeFunnels.reduce((sum, f) => sum + f.steps[f.steps.length - 1].visitors, 0);
  const avgConversionRate = activeFunnels.length > 0
    ? activeFunnels.reduce((sum, f) => sum + f.conversionRate, 0) / activeFunnels.length
    : 0;
  const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
  const totalDropoff = totalVisitors > 0 ? ((totalVisitors - totalConversions) / totalVisitors) * 100 : 0;

  // Find best and worst performing active funnels
  const bestFunnel = activeFunnels.length > 0
    ? activeFunnels.reduce((best, f) => f.conversionRate > best.conversionRate ? f : best, activeFunnels[0])
    : null;
  const worstFunnel = activeFunnels.length > 0
    ? activeFunnels.reduce((worst, f) => f.conversionRate < worst.conversionRate ? f : worst, activeFunnels[0])
    : null;

  const handleToggleFunnelActive = async (funnelId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/funnels/${funnelId}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        // Update local state
        setFunnels(funnels.map(f =>
          f.id === funnelId ? { ...f, is_active: !currentStatus } : f
        ));
      } else {
        alert('❌ Error toggling funnel status');
      }
    } catch (error) {
      console.error('Error toggling funnel:', error);
      alert('❌ Error toggling funnel status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Product Funnels" breadcrumb={["Dashboard", "Products", "Loading..."]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading funnels...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Product Not Found" breadcrumb={["Dashboard", "Products"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-[#666666] mb-4 mx-auto" />
            <p className="text-[16px] text-[#888888]">Product not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title={product.name} breadcrumb={["Dashboard", "Products", product.name]} />

      <div className="p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/products"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0a0a0a] border border-white/10 hover:border-[#7c5cff]/50 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-[#fafafa]" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${product.color}20` }}
              >
                <Folder className="w-5 h-5" style={{ color: product.color }} />
              </div>
              <h1 className="text-[28px] font-bold text-[#fafafa]">{product.name}</h1>
            </div>
            {product.description && (
              <p className="text-[15px] text-[#888888]">{product.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
                <span className="text-[13px] text-[#888888]">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
            <button
              onClick={() => loadData()}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-3 bg-[#0a0a0a] border border-white/10 text-[#fafafa] text-[14px] font-medium rounded-xl hover:border-[#7c5cff]/50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Funnel
            </button>
          </div>
        </div>

        {/* Macro Analysis Section - Only Active Funnels */}
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111111] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-[#fafafa]">Analisi Macro Funnel Attivi</h2>
                <p className="text-[13px] text-[#666666]">
                  {activeFunnels.length} funnel attivi su {funnels.length} totali
                </p>
              </div>
            </div>
            {activeFunnels.length === 0 && (
              <div className="px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg">
                <span className="text-[13px] text-[#f59e0b]">Nessun funnel attivo</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-[#000000]/50 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#7c5cff]" />
                <span className="text-[11px] text-[#666666] uppercase">Funnel Attivi</span>
              </div>
              <p className="text-[24px] font-bold text-[#fafafa]">{activeFunnels.length}</p>
            </div>

            <div className="bg-[#000000]/50 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#00d4aa]" />
                <span className="text-[11px] text-[#666666] uppercase">Visitatori</span>
              </div>
              <p className="text-[24px] font-bold text-[#fafafa]">{totalVisitors.toLocaleString()}</p>
            </div>

            <div className="bg-[#000000]/50 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#00d4aa]" />
                <span className="text-[11px] text-[#666666] uppercase">Conversioni</span>
              </div>
              <p className="text-[24px] font-bold text-[#00d4aa]">{totalConversions.toLocaleString()}</p>
            </div>

            <div className="bg-[#000000]/50 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[#7c5cff]" />
                <span className="text-[11px] text-[#666666] uppercase">Conv. Rate</span>
              </div>
              <p className="text-[24px] font-bold text-[#7c5cff]">{overallConversionRate.toFixed(1)}%</p>
            </div>

            <div className="bg-[#000000]/50 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-[#ff6b6b]" />
                <span className="text-[11px] text-[#666666] uppercase">Drop-off</span>
              </div>
              <p className="text-[24px] font-bold text-[#ff6b6b]">{totalDropoff.toFixed(1)}%</p>
            </div>
          </div>

          {/* Best/Worst Performers */}
          {activeFunnels.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {bestFunnel && (
                <div className="flex items-center gap-4 bg-[#00d4aa]/5 border border-[#00d4aa]/20 rounded-xl p-4">
                  <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#00d4aa]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-[#666666] uppercase mb-1">Migliore Performance</p>
                    <p className="text-[15px] font-semibold text-[#fafafa]">{bestFunnel.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-bold text-[#00d4aa]">{bestFunnel.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              )}
              {worstFunnel && bestFunnel?.id !== worstFunnel?.id && (
                <div className="flex items-center gap-4 bg-[#ff6b6b]/5 border border-[#ff6b6b]/20 rounded-xl p-4">
                  <div className="w-10 h-10 bg-[#ff6b6b]/20 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-[#ff6b6b]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-[#666666] uppercase mb-1">Da Migliorare</p>
                    <p className="text-[15px] font-semibold text-[#fafafa]">{worstFunnel.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-bold text-[#ff6b6b]">{worstFunnel.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Funnel Builder */}
        {showBuilder ? (
          <FunnelBuilder
            onSave={handleSaveFunnel}
            onCancel={() => setShowBuilder(false)}
          />
        ) : (
          <>
            {/* Search and Filter */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Search funnels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-[#fafafa] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-4 pr-10 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-[#fafafa] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all cursor-pointer"
                >
                  <option value="conversion">Sort by Conversion Rate</option>
                  <option value="visitors">Sort by Visitors</option>
                  <option value="name">Sort by Name</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666] pointer-events-none" />
              </div>
            </div>

            {/* Funnels Grid */}
            {filteredFunnels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-16 h-16 text-[#666666] mb-4" />
                <p className="text-[16px] text-[#888888] mb-2">No funnels found</p>
                <p className="text-[14px] text-[#666666]">
                  {searchQuery ? "Try a different search term" : "Create your first funnel to get started"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFunnels.map((funnel) => {
                  const firstStep = funnel.steps[0];
                  const lastStep = funnel.steps[funnel.steps.length - 1];
                  const funnelDropoff = firstStep.visitors > 0
                    ? ((firstStep.visitors - lastStep.visitors) / firstStep.visitors) * 100
                    : 0;
                  const isGoodConversion = funnel.conversionRate >= avgConversionRate;
                  const isActive = funnel.is_active !== false;

                  const isActive = funnel.is_active !== false;

                  return (
                    <div
                      key={funnel.id}
                      className={`group bg-[#0a0a0a] border rounded-2xl p-6 transition-all ${
                        isActive
                          ? "border-white/10 hover:border-[#7c5cff]/50 hover:shadow-lg hover:shadow-[#7c5cff]/10"
                          : "border-white/5 opacity-60"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/funnels/${funnel.id}`}
                              className="text-[18px] font-semibold text-[#fafafa] hover:text-[#7c5cff] transition-colors"
                            >
                              {funnel.name}
                            </Link>
                            {!isActive && (
                              <span className="px-2 py-0.5 bg-[#666666]/20 text-[#666666] text-[10px] uppercase rounded">
                                Inattivo
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#666666]">
                            {funnel.steps.length} steps
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                              isGoodConversion
                                ? "bg-[#00d4aa]/10 text-[#00d4aa]"
                                : "bg-[#f59e0b]/10 text-[#f59e0b]"
                            }`}
                          >
                            {funnel.conversionRate.toFixed(1)}%
                          </div>
                          {/* Active Toggle */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleActive(funnel.id, isActive);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? "bg-[#00d4aa]/10 text-[#00d4aa] hover:bg-[#00d4aa]/20"
                                : "bg-[#666666]/10 text-[#666666] hover:bg-[#666666]/20"
                            }`}
                            title={isActive ? "Disattiva funnel (escludi da analisi)" : "Attiva funnel (includi in analisi)"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFunnel(funnel.id, funnel.name);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ff6b6b]/10 text-[#666666] hover:text-[#ff6b6b] transition-colors"
                            title="Elimina funnel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Active Toggle */}
                      <div className="flex items-center justify-between py-3 px-4 bg-[#111111] rounded-xl mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00d4aa]' : 'bg-[#666666]'}`} />
                          <span className="text-[13px] text-[#888888]">
                            {isActive ? 'Active in analytics' : 'Excluded from analytics'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFunnelActive(funnel.id, isActive);
                          }}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            isActive ? 'bg-[#00d4aa]' : 'bg-[#2a2a2a]'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                              isActive ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        <div>
                          <p className="text-[11px] text-[#666666] uppercase mb-1">Visitors</p>
                          <p className="text-[16px] font-bold text-[#fafafa]">
                            {firstStep.visitors.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#666666] uppercase mb-1">Converted</p>
                          <p className="text-[16px] font-bold text-[#00d4aa]">
                            {lastStep.visitors.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#666666] uppercase mb-1">Drop-off</p>
                          <p className="text-[16px] font-bold text-[#ff6b6b]">
                            {isNaN(funnelDropoff) ? "0" : funnelDropoff.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* View Details Link */}
                      <Link
                        href={`/funnels/${funnel.id}`}
                        className="mt-4 flex items-center justify-end gap-2 text-[13px] text-[#7c5cff] hover:gap-3 transition-all"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
