"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Plus, Package, Trash2 } from "lucide-react";

interface ProductBrief {
  id: string;
  product_name: string;
  product_description: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductBrief[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("my_products_briefs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", JSON.stringify(error, null, 2));
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error details:", error.details);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productDescription.trim()) return;

    setIsSaving(true);
    const { error } = await supabase.from("my_products_briefs").insert({
      product_name: productName.trim(),
      product_description: productDescription.trim(),
    });

    if (error) {
      console.error("Error saving product:", JSON.stringify(error, null, 2));
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
    } else {
      setProductName("");
      setProductDescription("");
      setIsModalOpen(false);
      fetchProducts();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("my_products_briefs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
    } else {
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header
        title="My Products"
        breadcrumb={["Dashboard", "My Products"]}
        actionLabel="New Product Brief"
        onAction={() => setIsModalOpen(true)}
      />

      <div className="p-10">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="border border-dashed border-[#2a2a2a] rounded-[20px] p-20 flex flex-col items-center justify-center min-h-[450px] bg-[#080808]">
            <div className="w-20 h-20 bg-[#121212] rounded-full flex items-center justify-center mb-8 border border-[#1a1a1a]">
              <Package className="w-9 h-9 text-[#555555]" />
            </div>

            <h4 className="text-[20px] font-semibold text-[#fafafa] mb-3 font-['Space_Grotesk']">
              No product briefs yet
            </h4>
            <p className="text-[15px] text-[#666666] text-center mb-10 max-w-md leading-relaxed">
              Create your first product brief to get started
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-3 px-7 py-4 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white font-medium rounded-[12px] transition-all hover:opacity-90 shadow-lg shadow-purple-500/25"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[15px]">New Product Brief</span>
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[16px] p-6 hover:border-[#2a2a2a] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff]/20 to-[#00d4aa]/20 rounded-[10px] flex items-center justify-center">
                    <Package className="w-5 h-5 text-[#7c5cff]" />
                  </div>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-[#555555] hover:text-red-500 hover:bg-red-500/10 rounded-[8px] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-[16px] font-semibold text-[#fafafa] mb-2 font-['Space_Grotesk']">
                  {product.product_name}
                </h3>
                <p className="text-[14px] text-[#888888] leading-relaxed line-clamp-3">
                  {product.product_description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[20px] p-8 w-full max-w-lg mx-4">
            <h2 className="text-[22px] font-bold text-[#fafafa] mb-6 font-['Space_Grotesk']">
              New Product Brief
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[14px] font-medium text-[#888888] mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] px-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#888888] mb-2">
                  Product Description
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={5}
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] px-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setProductName("");
                    setProductDescription("");
                  }}
                  className="flex-1 px-6 py-3.5 text-[#888888] text-[14px] font-medium hover:bg-[#151515] rounded-[12px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !productName.trim() || !productDescription.trim()}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[14px] font-medium rounded-[12px] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                >
                  {isSaving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

