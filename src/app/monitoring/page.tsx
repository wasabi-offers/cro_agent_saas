"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar,
  Hash,
  Search,
  Folder,
  ExternalLink,
} from "lucide-react";

interface BrandData {
  name: string;
  firstEmailDate: string;
  lastEmailDate: string;
  totalEmails: number;
  analyzedCount: number;
}

interface FolderGroup {
  letter: string;
  brands: BrandData[];
  isExpanded: boolean;
}

export default function MonitoringPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBrandData();
  }, []);

  const fetchBrandData = async () => {
    setIsLoading(true);

    // Fetch all emails with necessary fields
    let allEmails: { from_name: string; created_at: string; email_analyzed: boolean | null }[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("emails")
        .select("from_name, created_at, email_analyzed")
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Error fetching emails:", error);
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

    // Group by brand and calculate stats
    const brandMap: Record<string, {
      emails: { created_at: string; email_analyzed: boolean | null }[];
    }> = {};

    allEmails.forEach((email) => {
      const name = email.from_name || "Unknown Sender";
      if (!brandMap[name]) {
        brandMap[name] = { emails: [] };
      }
      brandMap[name].emails.push({
        created_at: email.created_at,
        email_analyzed: email.email_analyzed,
      });
    });

    // Convert to brand data
    const brands: BrandData[] = Object.entries(brandMap).map(([name, data]) => {
      const dates = data.emails.map((e) => new Date(e.created_at).getTime());
      const analyzedCount = data.emails.filter((e) => e.email_analyzed === true).length;
      
      return {
        name,
        firstEmailDate: new Date(Math.min(...dates)).toISOString(),
        lastEmailDate: new Date(Math.max(...dates)).toISOString(),
        totalEmails: data.emails.length,
        analyzedCount,
      };
    });

    // Sort by name
    brands.sort((a, b) => a.name.localeCompare(b.name));

    // Group by first letter
    const letterGroups: Record<string, BrandData[]> = {};
    brands.forEach((brand) => {
      const letter = brand.name.charAt(0).toUpperCase();
      const groupKey = /[A-Z]/.test(letter) ? letter : "#";
      if (!letterGroups[groupKey]) {
        letterGroups[groupKey] = [];
      }
      letterGroups[groupKey].push(brand);
    });

    // Convert to folder groups
    const folderGroups: FolderGroup[] = Object.entries(letterGroups)
      .map(([letter, brands]) => ({
        letter,
        brands,
        isExpanded: false,
      }))
      .sort((a, b) => {
        if (a.letter === "#") return 1;
        if (b.letter === "#") return -1;
        return a.letter.localeCompare(b.letter);
      });

    setFolders(folderGroups);
    // Auto-expand first 3 folders
    setExpandedFolders(new Set(folderGroups.slice(0, 3).map((f) => f.letter)));
    setIsLoading(false);
  };

  const toggleFolder = (letter: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(letter)) {
        newSet.delete(letter);
      } else {
        newSet.add(letter);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const navigateToEmails = (senderName: string) => {
    router.push(`/emails?sender=${encodeURIComponent(senderName)}`);
  };

  // Filter brands based on search
  const filteredFolders = folders
    .map((folder) => ({
      ...folder,
      brands: folder.brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((folder) => folder.brands.length > 0);

  const totalBrands = folders.reduce((acc, f) => acc + f.brands.length, 0);
  const totalEmails = folders.reduce(
    (acc, f) => acc + f.brands.reduce((a, b) => a + b.totalEmails, 0),
    0
  );

  return (
    <div className="min-h-screen bg-black">
      <Header title="Monitoring" breadcrumb={["Dashboard", "Monitoring"]} />

      <div className="p-10">
        {/* Stats Bar */}
        <div className="flex items-center gap-6 mb-8 p-4 bg-[#0a0a0a] border border-white/10 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7c5cff]" />
            <span className="text-[13px] text-[#888888]">Total Brands:</span>
            <span className="text-[14px] text-[#fafafa] font-semibold">
              {totalBrands.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
            <span className="text-[13px] text-[#888888]">Total Emails:</span>
            <span className="text-[14px] text-[#fafafa] font-semibold">
              {totalEmails.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brands..."
            className="w-full bg-[#111111] border border-[#1a1a1a] rounded-[12px] pl-12 pr-4 py-3.5 text-[15px] text-[#fafafa] placeholder-[#555555] focus:outline-none focus:border-[#7c5cff] transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#7c5cff] animate-spin" />
              <p className="text-[#666666] text-[14px]">Loading brands...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFolders.map((folder) => {
              const isExpanded = expandedFolders.has(folder.letter);
              const folderEmailCount = folder.brands.reduce(
                (acc, b) => acc + b.totalEmails,
                0
              );

              return (
                <div
                  key={folder.letter}
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* Folder Header */}
                  <button
                    onClick={() => toggleFolder(folder.letter)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
                        <Folder className="w-5 h-5 text-[#7c5cff]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[18px] font-bold text-[#fafafa]">
                          {folder.letter}
                        </h3>
                        <p className="text-[12px] text-[#666666]">
                          {folder.brands.length} Brands
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[13px] text-[#888888]">Total Emails</p>
                        <p className="text-[14px] text-[#00d4aa] font-semibold">
                          {folderEmailCount.toLocaleString()}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[#666666]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#666666]" />
                      )}
                    </div>
                  </button>

                  {/* Brands List */}
                  {isExpanded && (
                    <div className="border-t border-white/10">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#111111] text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                        <div className="col-span-4 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          Name
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          Data Since
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          Last Email
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5" />
                          Total Emails
                        </div>
                        <div className="col-span-2 text-right">Action</div>
                      </div>

                      {/* Brand Rows */}
                      {folder.brands.map((brand) => (
                        <div
                          key={brand.name}
                          className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-white/5 hover:bg-white/5 transition-colors group"
                        >
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#7c5cff]/30 to-[#00d4aa]/30 rounded-lg flex items-center justify-center text-[12px] font-bold text-[#fafafa]">
                              {brand.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[14px] text-[#fafafa] font-medium truncate">
                              {brand.name}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className="text-[13px] text-[#888888]">
                              {formatDate(brand.firstEmailDate)}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className="text-[13px] text-[#888888]">
                              {formatDate(brand.lastEmailDate)}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                              <span className="text-[13px] text-[#00d4aa] font-medium">
                                {brand.totalEmails.toLocaleString()}
                              </span>
                            </div>
                            {brand.analyzedCount > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                                <span className="text-[12px] text-[#f59e0b]">
                                  {brand.analyzedCount} analyzed
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 flex items-center justify-end">
                            <button
                              onClick={() => navigateToEmails(brand.name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c5cff]/20 text-[#a78bff] text-[12px] font-medium rounded-lg hover:bg-[#7c5cff]/30 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

