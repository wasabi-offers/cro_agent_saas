"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Plus, Package, Trash2, Upload, Link, FileText, Image, Sparkles, Loader2, X, Edit3 } from "lucide-react";

interface ProductBrief {
  id: string;
  product_name: string;
  product_description: string;
  created_at: string;
}

type InputType = "manual" | "url" | "pdf" | "image" | "text";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductBrief[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // AI Analysis states
  const [inputType, setInputType] = useState<InputType>("manual");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const resetModal = () => {
    setProductName("");
    setProductDescription("");
    setInputType("manual");
    setUrlInput("");
    setTextInput("");
    setSelectedFile(null);
    setAnalysisComplete(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("inputType", inputType);

      if (inputType === "url") {
        if (!urlInput.trim()) {
          alert("Please enter a URL");
          setIsAnalyzing(false);
          return;
        }
        formData.append("url", urlInput.trim());
      } else if (inputType === "pdf" || inputType === "image") {
        if (!selectedFile) {
          alert("Please select a file");
          setIsAnalyzing(false);
          return;
        }
        formData.append("file", selectedFile);
      } else if (inputType === "text") {
        if (!textInput.trim()) {
          alert("Please enter some text");
          setIsAnalyzing(false);
          return;
        }
        formData.append("textContent", textInput.trim());
      }

      const response = await fetch("/api/analyze-product", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProductName(data.product_name);
        setProductDescription(data.product_description);
        setAnalysisComplete(true);
      } else {
        alert("Analysis failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze content");
    } finally {
      setIsAnalyzing(false);
    }
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
    } else {
      resetModal();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const inputTypes = [
    { id: "manual", label: "Manuale", icon: Edit3, description: "Inserisci manualmente" },
    { id: "url", label: "URL", icon: Link, description: "Analizza da link" },
    { id: "pdf", label: "PDF", icon: FileText, description: "Carica PDF" },
    { id: "image", label: "Immagine", icon: Image, description: "Carica immagine" },
    { id: "text", label: "Testo", icon: Upload, description: "Incolla testo" },
  ];

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
              <div>
                <h2 className="text-[22px] font-bold text-[#fafafa] font-['Space_Grotesk']">
                  New Product Brief
                </h2>
                <p className="text-[13px] text-[#666666] mt-1">
                  Crea manualmente o usa l'AI per analizzare contenuti
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetModal();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#666666]" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Input Type Selector */}
              {!analysisComplete && (
                <div className="mb-8">
                  <label className="block text-[14px] font-medium text-[#888888] mb-3">
                    Scegli il metodo di input
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {inputTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setInputType(type.id as InputType)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            inputType === type.id
                              ? "bg-[#7c5cff]/20 border-[#7c5cff] text-[#fafafa]"
                              : "bg-[#111111] border-[#1a1a1a] text-[#666666] hover:border-[#333333]"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[11px] font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Input Based on Type */}
              {!analysisComplete && inputType !== "manual" && (
                <div className="mb-6">
                  {inputType === "url" && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#888888] mb-2">
                        URL del prodotto
                      </label>
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/product"
                        className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] px-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors"
                      />
                    </div>
                  )}

                  {inputType === "pdf" && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#888888] mb-2">
                        Carica PDF
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-all ${
                          selectedFile
                            ? "border-[#00d4aa] bg-[#00d4aa]/10"
                            : "border-[#333333] hover:border-[#555555] bg-[#111111]"
                        }`}
                      >
                        <FileText className={`w-8 h-8 ${selectedFile ? "text-[#00d4aa]" : "text-[#555555]"}`} />
                        {selectedFile ? (
                          <span className="text-[14px] text-[#00d4aa] font-medium">{selectedFile.name}</span>
                        ) : (
                          <span className="text-[14px] text-[#666666]">Clicca per caricare un PDF</span>
                        )}
                      </button>
                    </div>
                  )}

                  {inputType === "image" && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#888888] mb-2">
                        Carica Immagine
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-all ${
                          selectedFile
                            ? "border-[#00d4aa] bg-[#00d4aa]/10"
                            : "border-[#333333] hover:border-[#555555] bg-[#111111]"
                        }`}
                      >
                        <Image className={`w-8 h-8 ${selectedFile ? "text-[#00d4aa]" : "text-[#555555]"}`} />
                        {selectedFile ? (
                          <span className="text-[14px] text-[#00d4aa] font-medium">{selectedFile.name}</span>
                        ) : (
                          <span className="text-[14px] text-[#666666]">Clicca per caricare un'immagine (JPEG, PNG, GIF, WebP)</span>
                        )}
                      </button>
                    </div>
                  )}

                  {inputType === "text" && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#888888] mb-2">
                        Incolla testo del prodotto
                      </label>
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Incolla qui la descrizione, caratteristiche, o qualsiasi testo sul prodotto..."
                        rows={6}
                        className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] px-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors resize-none"
                      />
                    </div>
                  )}

                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-[#00d4aa] to-[#00a080] text-white text-[15px] font-medium rounded-[12px] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analizzando con AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Analizza con Claude
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Analysis Complete Banner */}
              {analysisComplete && (
                <div className="mb-6 p-4 bg-[#00d4aa]/10 border border-[#00d4aa]/30 rounded-xl flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#00d4aa]" />
                  <span className="text-[14px] text-[#00d4aa] font-medium">
                    Analisi completata! Puoi modificare i campi prima di salvare.
                  </span>
                </div>
              )}

              {/* Product Form */}
              {(inputType === "manual" || analysisComplete) && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[14px] font-medium text-[#888888] mb-2">
                      Nome Prodotto
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
                      Descrizione Prodotto
                    </label>
                    <textarea
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Describe your product..."
                      rows={6}
                      className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] px-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetModal();
                      }}
                      className="flex-1 px-6 py-3.5 text-[#888888] text-[14px] font-medium hover:bg-[#151515] rounded-[12px] transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || !productName.trim() || !productDescription.trim()}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[14px] font-medium rounded-[12px] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                    >
                      {isSaving ? "Salvando..." : "Salva Prodotto"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
