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

  const totalVisitors = funnels.reduce((sum, f) => sum + f.steps[0].visitors, 0);
  const totalConversions = funnels.reduce((sum, f) => sum + f.steps[f.steps.length - 1].visitors, 0);
  const avgConversionRate = funnels.length > 0
    ? funnels.reduce((sum, f) => sum + f.conversionRate, 0) / funnels.length
    : 0;

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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[13px] text-[#888888]">Funnels</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {funnels.length}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <span className="text-[13px] text-[#888888]">Total Visitors</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {totalVisitors.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#888888]">Total Conversions</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {totalConversions.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[13px] text-[#888888]">Avg Conversion</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {avgConversionRate.toFixed(1)}%
            </p>
          </div>
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
                  const totalDropoff = ((firstStep.visitors - lastStep.visitors) / firstStep.visitors) * 100;
                  const isGoodConversion = funnel.conversionRate >= avgConversionRate;

                  return (
                    <Link
                      key={funnel.id}
                      href={`/funnels/${funnel.id}`}
                      className="group bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-[#7c5cff]/50 hover:shadow-lg hover:shadow-[#7c5cff]/10 transition-all cursor-pointer"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1 group-hover:text-[#7c5cff] transition-colors">
                            {funnel.name}
                          </h3>
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
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteFunnel(funnel.id, funnel.name);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ff6b6b]/10 text-[#666666] hover:text-[#ff6b6b] transition-colors"
                            title="Delete funnel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                            {totalDropoff.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* View Details Link */}
                      <div className="mt-4 flex items-center justify-end gap-2 text-[13px] text-[#7c5cff] group-hover:gap-3 transition-all">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
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
