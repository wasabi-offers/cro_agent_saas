"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Search, X, Loader2, Copy, Check } from "lucide-react";

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

export default function EmailsPage() {
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

  // Track if component has mounted (fixes hydration mismatch)
  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  return (
    <div className="min-h-screen bg-black">
      <Header title="E-mails" breadcrumb={["Dashboard", "E-mails"]} />

      <div className="p-10">
        {/* Search Bar */}
        <div className="mb-16">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by From Name..."
              className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] pl-12 pr-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors"
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-[13px] text-[#666666]">
              Showing {filteredEmails.length} of {emails.length} emails
            </p>
          )}
        </div>

        {/* Section Title */}
        <h2 className="text-2xl font-bold text-[#fafafa] py-5 mb-8">Emails</h2>

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
                    <tr key={email.id} className="hover:bg-[#0a0a0a] transition-colors">
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

                      {/* Action Button */}
                      <td className="border border-white/30 px-4 py-3">
                        <button 
                          onClick={() => handleSwipe(email)}
                          disabled={swipingEmailId === email.id}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {swipingEmailId === email.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Swiping...
                            </>
                          ) : (
                            <>
                              Swipe
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

