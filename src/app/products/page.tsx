"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Folder,
  Target,
  Edit2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  funnelCount: number;
  created_at: string;
  updated_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Project | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#7c5cff",
    icon: "Folder",
  });

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.products || []);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts([data.product, ...products]);
          setShowCreateDialog(false);
          setFormData({ name: "", description: "", color: "#7c5cff", icon: "Folder" });
          alert('✅ Project created successfully!');
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('❌ Error creating project');
    }
  };

  const handleDeleteProduct = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products?productId=${projectId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProducts(products.filter(p => p.id !== projectId));
        alert('✅ Project deleted successfully!');
      } else {
        alert(`❌ ${data.error || 'Error deleting project'}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('❌ Error deleting project');
    }
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProduct(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      color: project.color,
      icon: project.icon,
    });
    setShowEditDialog(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(products.map(p =>
            p.id === editingProduct.id ? { ...data.product, funnelCount: p.funnelCount } : p
          ));
          setShowEditDialog(false);
          setEditingProduct(null);
          setFormData({ name: "", description: "", color: "#7c5cff", icon: "Folder" });
          alert('✅ Project updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('❌ Error updating project');
    }
  };

  const filteredProducts = products.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFunnels = products.reduce((sum, p) => sum + p.funnelCount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="Products" breadcrumb={["Dashboard", "Products"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="Products" breadcrumb={["Dashboard", "Products"]} />

      <div className="p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#1a1a1a] mb-2">Projects</h1>
            <p className="text-[15px] text-[#888888]">
              Organize your funnels by project
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
                <span className="text-[13px] text-[#1a1a1a] font-semibold">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
            <button
              onClick={loadProducts}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 text-[#1a1a1a] text-[14px] font-medium rounded-xl hover:border-[#7c5cff]/50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Folder className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[13px] text-[#1a1a1a] font-bold">Total Projects</span>
            </div>
            <p className="text-[28px] font-bold text-[#1a1a1a]">
              {products.length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <span className="text-[13px] text-[#1a1a1a] font-bold">Total Funnels</span>
            </div>
            <p className="text-[28px] font-bold text-[#1a1a1a]">
              {totalFunnels}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#1a1a1a] font-bold">Avg Funnels/Project</span>
            </div>
            <p className="text-[28px] font-bold text-[#1a1a1a]">
              {products.length > 0 ? (totalFunnels / products.length).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Folder className="w-16 h-16 text-[#666666] mb-4" />
            <p className="text-[16px] text-[#888888] mb-2">No projects found</p>
            <p className="text-[14px] text-[#666666]">
              {searchQuery ? "Try a different search term" : "Create your first project to organize your funnels"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((project) => (
              <Link
                key={project.id}
                href={`/products/${project.id}`}
                className="group bg-[#0a0a0a] border border-[#d0d0d0] rounded-2xl p-6 hover:border-[#7c5cff]/50 hover:shadow-lg hover:shadow-[#7c5cff]/10 transition-all cursor-pointer"
              >
                {/* Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <Folder className="w-7 h-7" style={{ color: project.color }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEdit(project);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#7c5cff]/10 text-[#666666] hover:text-[#7c5cff] transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteProduct(project.id, project.name);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ff6b6b]/10 text-white/70 hover:text-[#ff6b6b] transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#7c5cff] transition-colors">
                  {project.name}
                </h3>

                {/* Description */}
                {project.description && (
                  <p className="text-[13px] text-[#666666] mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Stats */}
                <div className="pt-4 border-t border-[#7c5cff]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#666666] uppercase font-semibold">Funnels</span>
                    <span className="text-[16px] font-bold text-[#1a1a1a]">
                      {project.funnelCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-[22px] font-bold text-[#1a1a1a] mb-6">Create New Project</h2>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E-commerce, SaaS, Mobile App..."
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this project..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer bg-white/80 border border-[#7c5cff]/30"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#7c5cff"
                    className="flex-1 px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setFormData({ name: "", description: "", color: "#7c5cff", icon: "Folder" });
                  }}
                  className="flex-1 px-5 py-3 bg-white/80 border border-[#7c5cff]/30 text-[#1a1a1a] text-[14px] font-medium rounded-xl hover:border-[#7c5cff]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Dialog */}
      {showEditDialog && editingProduct && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-[22px] font-bold text-[#1a1a1a] mb-6">Edit Project</h2>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E-commerce, SaaS, Mobile App..."
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this project..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer bg-white/80 border border-[#7c5cff]/30"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#7c5cff"
                    className="flex-1 px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingProduct(null);
                    setFormData({ name: "", description: "", color: "#7c5cff", icon: "Folder" });
                  }}
                  className="flex-1 px-5 py-3 bg-white/80 border border-[#7c5cff]/30 text-[#1a1a1a] text-[14px] font-medium rounded-xl hover:border-[#7c5cff]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
