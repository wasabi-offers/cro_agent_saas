"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Search, X, Loader2, Copy, Check, Download, CheckSquare, Square, Zap, Sparkles } from "lucide-react";

interface Email {
  id: string;
  from_name: string;
  from_email: string;
  subject: string;
  text_body: string;
  html_body: string;
  labels: string | null;
  created_at: string;
}

// Parse labels string into array
function parseLabels(labels: string | null): string[] {
  if (!labels) return [];
  // Handle comma-separated or other formats
  return labels.split(",").map((l) => l.trim()).filter(Boolean);
}

interface ProductBrief {
  id: string | number;
  product_name: string;
  product_description: string;
}

interface SwipeResult {
  success: boolean;
  originalContent: string;
  swipedContent: string;
  productName: string;
  productDescription: string;
  timestamp: string;
}

interface BatchSwipeResult {
  emailId: string;
  subject: string;
  success: boolean;
  swipedContent?: string;
  error?: string;
}

interface AnalysisResult {
  success: boolean;
  analysis: string;
  emailSubject: string;
  fromName: string;
}

// Extract links from HTML content
function extractLinks(html: string): string[] {
  if (!html) return [];
  const linkRegex = /href=["']([^"']+)["']/gi;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1] && !match[1].startsWith("mailto:") && !match[1].startsWith("#")) {
      links.push(match[1]);
    }
  }
  return [...new Set(links)]; // Remove duplicates
}

function EmailsPageContent() {
  const searchParams = useSearchParams();
  const [emails, setEmails] = useState<Email[]>([]);
  const [productBriefs, setProductBriefs] = useState<ProductBrief[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [swipingEmailId, setSwipingEmailId] = useState<string | null>(null);
  const [swipeResult, setSwipeResult] = useState<SwipeResult | null>(null);
  const [showSwipeModal, setShowSwipeModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Multi-select and batch swipe states
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [batchProductId, setBatchProductId] = useState<string>("");
  const [isBatchSwiping, setIsBatchSwiping] = useState(false);
  const [batchSwipeResults, setBatchSwipeResults] = useState<BatchSwipeResult[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  
  // Email analysis states
  const [analyzingEmailId, setAnalyzingEmailId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Track if component has mounted and read URL params
  useEffect(() => {
    setHasMounted(true);
    // Read sender from URL query params
    const senderParam = searchParams.get("sender");
    if (senderParam) {
      setSearchTerm(senderParam);
    }
  }, [searchParams]);

  // Filter emails by from_name
  const filteredEmails = emails.filter((email) =>
    email.from_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchEmails();
    fetchProductBriefs();
  }, []);

  const fetchEmails = async () => {
    setIsLoading(true);
    
    // Fetch all emails using pagination (Supabase has 1000 row limit per request)
    let allEmails: Email[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Error fetching emails:", JSON.stringify(error, null, 2));
        break;
      }

      if (data && data.length > 0) {
        allEmails = [...allEmails, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    setEmails(allEmails);
    setIsLoading(false);
  };

  const fetchProductBriefs = async () => {
    const { data, error } = await supabase
      .from("my_products_briefs")
      .select("id, product_name, product_description")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching product briefs:", error);
    } else {
      setProductBriefs(data || []);
    }
  };

  const handleProductSelect = (emailId: string, productId: string) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [emailId]: productId,
    }));
  };

  const handleSwipe = async (email: Email) => {
    const selectedProductId = selectedProducts[email.id];
    
    if (!selectedProductId) {
      alert("Please select a product brief first");
      return;
    }

    // Convert to string for comparison since HTML select returns string values
    const selectedProduct = productBriefs.find(p => String(p.id) === selectedProductId);
    
    if (!selectedProduct) {
      alert("Product brief not found");
      return;
    }

    if (!email.subject && !email.text_body) {
      alert("No email content available to swipe");
      return;
    }

    setSwipingEmailId(email.id);

    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: email.subject || "",
          textBody: email.text_body || "",
          productName: selectedProduct.product_name,
          productDescription: selectedProduct.product_description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSwipeResult(data);
        setShowSwipeModal(true);
      } else {
        alert("Swipe failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Swipe error:", error);
      alert("Failed to connect to swipe API");
    } finally {
      setSwipingEmailId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!hasMounted) return ""; // Prevent hydration mismatch
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Handle email analysis
  const handleAnalyze = async (email: Email) => {
    if (!email.subject && !email.text_body) {
      alert("No email content available to analyze");
      return;
    }

    setAnalyzingEmailId(email.id);

    try {
      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromName: email.from_name,
          fromEmail: email.from_email,
          subject: email.subject,
          textBody: email.text_body,
          htmlBody: email.html_body,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data);
        setShowAnalysisModal(true);
      } else {
        alert("Analysis failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze email");
    } finally {
      setAnalyzingEmailId(null);
    }
  };

  // Toggle email selection
  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  // Select/Deselect all visible emails
  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails.map((e) => e.id)));
    }
  };

  // Batch swipe handler
  const handleBatchSwipe = async () => {
    if (selectedEmails.size === 0) {
      alert("Please select at least one email");
      return;
    }

    if (!batchProductId) {
      alert("Please select a product for batch swipe");
      return;
    }

    const selectedProduct = productBriefs.find((p) => String(p.id) === batchProductId);
    if (!selectedProduct) {
      alert("Product not found");
      return;
    }

    const emailsToSwipe = filteredEmails.filter((e) => selectedEmails.has(e.id));
    
    setIsBatchSwiping(true);
    setBatchSwipeResults([]);
    setBatchProgress({ current: 0, total: emailsToSwipe.length });
    setShowBatchModal(true);

    const results: BatchSwipeResult[] = [];

    for (let i = 0; i < emailsToSwipe.length; i++) {
      const email = emailsToSwipe[i];
      setBatchProgress({ current: i + 1, total: emailsToSwipe.length });

      try {
        const response = await fetch("/api/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: email.subject || "",
            textBody: email.text_body || "",
            productName: selectedProduct.product_name,
            productDescription: selectedProduct.product_description,
          }),
        });

        const data = await response.json();

        results.push({
          emailId: email.id,
          subject: email.subject || "No subject",
          success: data.success,
          swipedContent: data.swipedContent,
          error: data.error,
        });
      } catch (error) {
        results.push({
          emailId: email.id,
          subject: email.subject || "No subject",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      setBatchSwipeResults([...results]);
    }

    setIsBatchSwiping(false);
    setSelectedEmails(new Set());
  };

  // Export batch results to CSV
  const exportBatchResultsToCSV = () => {
    if (batchSwipeResults.length === 0) return;

    const headers = ["Subject", "Status", "Swiped Content"];
    const escapeCSV = (field: string | undefined): string => {
      if (!field) return "";
      const str = String(field);
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      headers.join(","),
      ...batchSwipeResults.map((result) =>
        [
          escapeCSV(result.subject),
          result.success ? "Success" : "Failed",
          escapeCSV(result.swipedContent || result.error || ""),
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `batch_swipe_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export emails to CSV
  const exportToCSV = () => {
    const emailsToExport = searchTerm ? filteredEmails : emails;
    
    if (emailsToExport.length === 0) {
      alert("No emails to export");
      return;
    }

    // CSV headers
    const headers = ["From Name", "From Email", "Subject", "Text Body", "Labels", "Created At"];
    
    // Escape CSV field (handle quotes and commas)
    const escapeCSV = (field: string | null | undefined): string => {
      if (!field) return "";
      const str = String(field);
      // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csvRows = [
      headers.join(","),
      ...emailsToExport.map((email) =>
        [
          escapeCSV(email.from_name),
          escapeCSV(email.from_email),
          escapeCSV(email.subject),
          escapeCSV(email.text_body),
          escapeCSV(email.labels),
          escapeCSV(email.created_at),
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `emails_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header title="E-mails" breadcrumb={["Dashboard", "E-mails"]} />

      <div className="p-10">
        {/* Search Bar & Export */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by From Name..."
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] pl-12 pr-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors"
              />
            </div>
            <button
              onClick={exportToCSV}
              disabled={isLoading || emails.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-[#00d4aa]/20 border border-[#00d4aa]/30 text-[#00d4aa] text-[14px] font-medium rounded-xl hover:bg-[#00d4aa]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
              {!isLoading && emails.length > 0 && (
                <span className="text-[12px] opacity-70">
                  ({searchTerm ? filteredEmails.length : emails.length})
                </span>
              )}
            </button>
          </div>
          {searchTerm && (
            <p className="mt-2 text-[13px] text-[#666666]">
              Showing {filteredEmails.length} of {emails.length} emails
            </p>
          )}
        </div>

        {/* Section Title & Batch Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5 mb-8">
          <h2 className="text-2xl font-bold text-[#fafafa]">Emails</h2>
          
          {/* Batch Swipe Controls */}
          {selectedEmails.size > 0 && (
            <div className="flex items-center gap-4 bg-[#111111] border border-[#7c5cff]/30 rounded-xl px-4 py-3">
              <span className="text-[13px] text-[#a78bff] font-medium">
                {selectedEmails.size} selected
              </span>
              <select
                value={batchProductId}
                onChange={(e) => setBatchProductId(e.target.value)}
                className="bg-[#0a0a0a] border border-white/20 rounded-lg px-3 py-2 text-[13px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff]"
              >
                <option value="">Select product...</option>
                {productBriefs.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBatchSwipe}
                disabled={!batchProductId || isBatchSwiping}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Batch Swipe
              </button>
              <button
                onClick={() => setSelectedEmails(new Set())}
                className="text-[13px] text-[#666666] hover:text-[#fafafa] transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center text-[#666666] py-20">
            {searchTerm ? "No emails match your search." : "No emails found in the database."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#111111]">
                  <th className="border border-white/30 px-4 py-3 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-[#7c5cff] hover:text-[#a78bff] transition-colors"
                    >
                      {selectedEmails.size === filteredEmails.length && filteredEmails.length > 0 ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap">
                    From Name
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap">
                    From Email
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap">
                    Subject
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap min-w-[250px]">
                    Text Body
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap min-w-[250px]">
                    HTML Body
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap min-w-[200px]">
                    Links
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap">
                    Labels
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap">
                    Created At
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap min-w-[180px]">
                    Product Brief
                  </th>
                  <th className="border border-white/30 px-4 py-3 text-left text-[13px] font-semibold text-[#fafafa] whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmails.map((email) => {
                  const links = extractLinks(email.html_body);
                  return (
                    <tr key={email.id} className={`hover:bg-[#0a0a0a] transition-colors ${selectedEmails.has(email.id) ? "bg-[#7c5cff]/10" : ""}`}>
                      {/* Checkbox */}
                      <td className="border border-white/30 px-4 py-3 text-center">
                        <button
                          onClick={() => toggleEmailSelection(email.id)}
                          className="text-[#7c5cff] hover:text-[#a78bff] transition-colors"
                        >
                          {selectedEmails.has(email.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      {/* From Name */}
                      <td className="border border-white/30 px-4 py-3 text-[13px] text-[#cccccc]">
                        {email.from_name || "-"}
                      </td>

                      {/* From Email */}
                      <td className="border border-white/30 px-4 py-3 text-[13px] text-[#cccccc]">
                        {email.from_email || "-"}
                      </td>

                      {/* Subject */}
                      <td className="border border-white/30 px-4 py-3 text-[13px] text-[#cccccc]">
                        <div>
                          {email.subject || "-"}
                        </div>
                      </td>

                      {/* Text Body */}
                      <td className="border border-white/30 px-4 py-3 text-[13px] text-[#999999] min-w-[250px] max-w-[300px]">
                        <div
                          className="relative cursor-pointer group"
                          onMouseEnter={() => setExpandedCell(`text-${email.id}`)}
                          onMouseLeave={() => setExpandedCell(null)}
                        >
                          <div className="line-clamp-3 leading-relaxed">
                            {truncateText(email.text_body, 150)}
                          </div>
                          {expandedCell === `text-${email.id}` && email.text_body && (
                            <div className="absolute z-50 left-0 top-full mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg p-4 max-w-[500px] max-h-[400px] overflow-y-auto shadow-xl">
                              <p className="text-[12px] text-[#cccccc] whitespace-pre-wrap leading-relaxed">
                                {email.text_body}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* HTML Body */}
                      <td className="border border-white/30 px-4 py-3 text-[13px] text-[#999999] min-w-[250px] max-w-[300px]">
                        <div
                          className="relative cursor-pointer group"
                          onMouseEnter={() => setExpandedCell(`html-${email.id}`)}
                          onMouseLeave={() => setExpandedCell(null)}
                        >
                          <div className="line-clamp-3 leading-relaxed font-mono text-[11px]">
                            {truncateText(email.html_body, 150)}
                          </div>
                          {expandedCell === `html-${email.id}` && email.html_body && (
                            <div className="absolute z-50 left-0 top-full mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg p-4 max-w-[600px] max-h-[400px] overflow-y-auto shadow-xl">
                              <pre className="text-[11px] text-[#cccccc] whitespace-pre-wrap font-mono leading-relaxed">
                                {email.html_body}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Links */}
                      <td className="border border-white/30 px-4 py-3 text-[13px] text-[#999999] min-w-[200px] max-w-[250px]">
                        <div
                          className="relative cursor-pointer"
                          onMouseEnter={() => setExpandedCell(`links-${email.id}`)}
                          onMouseLeave={() => setExpandedCell(null)}
                        >
                          <div className="text-[#7c5cff]">
                            {links.length > 0 ? `${links.length} link${links.length > 1 ? "s" : ""}` : "-"}
                          </div>
                          {expandedCell === `links-${email.id}` && links.length > 0 && (
                            <div className="absolute z-50 left-0 top-full mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg p-4 max-w-[500px] max-h-[300px] overflow-y-auto shadow-xl">
                              <ul className="space-y-2">
                                {links.map((link, idx) => (
                                  <li key={idx} className="text-[11px] text-[#7c5cff] break-all hover:underline">
                                    <a href={link} target="_blank" rel="noopener noreferrer">
                                      {link}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Labels */}
                      <td className="border border-white/30 px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            const labelsArray = parseLabels(email.labels);
                            return labelsArray.length > 0 ? (
                              labelsArray.map((label, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-[#7c5cff]/20 text-[#a78bff] text-[11px] rounded-full font-medium"
                                >
                                  {label}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#666666] text-[13px]">-</span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="border border-white/30 px-4 py-3 text-[13px] text-[#999999] whitespace-nowrap">
                        {formatDate(email.created_at)}
                      </td>

                      {/* Product Brief Select */}
                      <td className="border border-white/30 px-4 py-3">
                        <select
                          value={selectedProducts[email.id] || ""}
                          onChange={(e) => handleProductSelect(email.id, e.target.value)}
                          className="w-full bg-[#111111] border border-white/20 rounded-lg px-3 py-2 text-[13px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff] transition-colors cursor-pointer"
                        >
                          <option value="">Select product...</option>
                          {productBriefs.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.product_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Action Buttons */}
                      <td className="border border-white/30 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSwipe(email)}
                            disabled={swipingEmailId === email.id}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[12px] font-medium rounded-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {swipingEmailId === email.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                Swipe
                                <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => handleAnalyze(email)}
                            disabled={analyzingEmailId === email.id}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#00d4aa] to-[#00a080] text-white text-[12px] font-medium rounded-lg hover:opacity-90 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {analyzingEmailId === email.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Analizza
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00d4aa]" />
                  <h2 className="text-[20px] font-semibold text-[#fafafa]">
                    Email Analysis
                  </h2>
                </div>
                <p className="text-[13px] text-[#666666] mt-1">
                  <span className="text-[#00d4aa]">{analysisResult.fromName}</span>
                  {" • "}
                  {analysisResult.emailSubject}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysisResult.analysis);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4aa]/20 text-[#00d4aa] text-[12px] font-medium rounded-lg hover:bg-[#00d4aa]/30 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    setAnalysisResult(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#999999]" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="prose prose-invert max-w-none">
                <div className="text-[14px] text-[#cccccc] leading-relaxed whitespace-pre-wrap">
                  {analysisResult.analysis.split('\n').map((line, index) => {
                    // Style headers
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={index} className="text-[18px] font-bold text-[#fafafa] mt-6 mb-3 flex items-center gap-2">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    // Style bullet points
                    if (line.startsWith('- ')) {
                      return (
                        <p key={index} className="text-[14px] text-[#cccccc] pl-4 py-1 border-l-2 border-[#00d4aa]/30 ml-2 my-1">
                          {line.replace('- ', '')}
                        </p>
                      );
                    }
                    // Style numbered items
                    if (/^\d+\./.test(line)) {
                      return (
                        <p key={index} className="text-[14px] text-[#cccccc] pl-4 py-1 border-l-2 border-[#7c5cff]/30 ml-2 my-1">
                          {line}
                        </p>
                      );
                    }
                    // Empty lines
                    if (line.trim() === '') {
                      return <div key={index} className="h-2" />;
                    }
                    // Regular text
                    return (
                      <p key={index} className="text-[14px] text-[#888888] my-1">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Swipe Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-[20px] font-semibold text-[#fafafa]">
                  Batch Swipe Results
                </h2>
                <p className="text-[13px] text-[#666666] mt-1">
                  {isBatchSwiping ? (
                    <span className="text-[#7c5cff]">
                      Processing {batchProgress.current} of {batchProgress.total}...
                    </span>
                  ) : (
                    <span>
                      {batchSwipeResults.filter((r) => r.success).length} successful,{" "}
                      {batchSwipeResults.filter((r) => !r.success).length} failed
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!isBatchSwiping && batchSwipeResults.length > 0 && (
                  <button
                    onClick={exportBatchResultsToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00d4aa]/20 text-[#00d4aa] text-[13px] font-medium rounded-lg hover:bg-[#00d4aa]/30 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowBatchModal(false);
                    setBatchSwipeResults([]);
                  }}
                  disabled={isBatchSwiping}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-[#999999]" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {isBatchSwiping && (
              <div className="px-6 py-3 border-b border-white/10">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7c5cff] to-[#a78bff] transition-all duration-300"
                    style={{
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Results List */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-3">
                {batchSwipeResults.map((result, index) => (
                  <div
                    key={result.emailId}
                    className={`p-4 rounded-xl border ${
                      result.success
                        ? "bg-[#00d4aa]/10 border-[#00d4aa]/30"
                        : "bg-[#ff6b6b]/10 border-[#ff6b6b]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold text-[#888888]">
                            #{index + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              result.success
                                ? "bg-[#00d4aa]/20 text-[#00d4aa]"
                                : "bg-[#ff6b6b]/20 text-[#ff6b6b]"
                            }`}
                          >
                            {result.success ? "SUCCESS" : "FAILED"}
                          </span>
                        </div>
                        <p className="text-[14px] text-[#fafafa] font-medium mb-2">
                          {result.subject}
                        </p>
                        {result.success && result.swipedContent && (
                          <div className="bg-[#0a0a0a] rounded-lg p-3 mt-2">
                            <p className="text-[12px] text-[#888888] line-clamp-3">
                              {result.swipedContent}
                            </p>
                          </div>
                        )}
                        {!result.success && result.error && (
                          <p className="text-[12px] text-[#ff6b6b]">{result.error}</p>
                        )}
                      </div>
                      {result.success && result.swipedContent && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.swipedContent || "");
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-[#666666]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swipe Result Modal */}
      {showSwipeModal && swipeResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/20 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-[20px] font-semibold text-[#fafafa]">Swipe Comparison</h2>
                <p className="text-[13px] text-[#666666] mt-1">
                  Product: <span className="text-[#7c5cff]">{swipeResult.productName}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowSwipeModal(false);
                    setSwipeResult(null);
                    setCopied(false);
                  }}
                  className="px-5 py-2.5 bg-white/10 text-[#fafafa] text-[13px] font-medium rounded-lg hover:bg-white/20 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSwipeModal(false);
                    setSwipeResult(null);
                    setCopied(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#999999]" />
                </button>
              </div>
            </div>

            {/* Modal Content - Comparison Table */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-2 gap-6">
                {/* Original Email Column */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#666666]"></div>
                    <h3 className="text-[16px] font-semibold text-[#999999]">Original Email</h3>
                  </div>
                  <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-5 min-h-[400px]">
                    <p className="text-[14px] text-[#888888] whitespace-pre-wrap leading-relaxed">
                      {swipeResult.originalContent}
                    </p>
                  </div>
                </div>

                {/* Swiped Content Column */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#7c5cff]"></div>
                      <h3 className="text-[16px] font-semibold text-[#7c5cff]">Swiped Content</h3>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(swipeResult.swipedContent);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c5cff]/20 text-[#a78bff] text-[12px] font-medium rounded-lg hover:bg-[#7c5cff]/30 transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex-1 bg-[#0a0a0a] border border-[#7c5cff]/30 rounded-xl p-5 min-h-[400px]">
                    <p className="text-[14px] text-[#fafafa] whitespace-pre-wrap leading-relaxed">
                      {swipeResult.swipedContent}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="mt-6 p-4 bg-[#0a0a0a] border border-white/10 rounded-xl">
                <p className="text-[12px] text-[#666666]">
                  <span className="text-[#999999] font-medium">Product Description:</span> {swipeResult.productDescription}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function EmailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black">
          <Header title="E-mails" breadcrumb={["Dashboard", "E-mails"]} />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <EmailsPageContent />
    </Suspense>
  );
}

