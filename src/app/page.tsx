"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Mail, Users, TrendingUp, Loader2 } from "lucide-react";

interface BrandStats {
  name: string;
  count: number;
  percentage: number;
}

export default function Home() {
  const [totalEmails, setTotalEmails] = useState<number>(0);
  const [brandStats, setBrandStats] = useState<BrandStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);

    // Fetch all emails to calculate stats
    let allEmails: { from_name: string }[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("emails")
        .select("from_name")
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

    // Calculate total
    setTotalEmails(allEmails.length);

    // Calculate brand/sender stats
    const brandCounts: Record<string, number> = {};
    allEmails.forEach((email) => {
      const name = email.from_name || "Unknown Sender";
      brandCounts[name] = (brandCounts[name] || 0) + 1;
    });

    // Sort by count and get top brands
    const sortedBrands = Object.entries(brandCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / allEmails.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    setBrandStats(sortedBrands);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header title="Dashboard" breadcrumb={["Dashboard"]} />

      <div className="p-10">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#7c5cff] animate-spin" />
              <p className="text-[#666666] text-[14px]">Loading statistics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Total Emails Card */}
              <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-7 h-7 text-[#7c5cff]" />
                  </div>
                  <div>
                    <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide">
                      Total Emails
                    </p>
                    <p className="text-[#fafafa] text-[36px] font-bold leading-tight">
                      {totalEmails.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Brands Card */}
              <div className="bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#00d4aa]/20 rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-[#00d4aa]" />
                  </div>
                  <div>
                    <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide">
                      Total Brands
                    </p>
                    <p className="text-[#fafafa] text-[36px] font-bold leading-tight">
                      {brandStats.length.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Avg per Brand Card */}
              <div className="bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff6b6b]/5 border border-[#ff6b6b]/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#ff6b6b]/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-[#ff6b6b]" />
                  </div>
                  <div>
                    <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide">
                      Avg per Brand
                    </p>
                    <p className="text-[#fafafa] text-[36px] font-bold leading-tight">
                      {brandStats.length > 0
                        ? Math.round(totalEmails / brandStats.length)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Brands Table */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10">
                <h2 className="text-[18px] font-semibold text-[#fafafa]">
                  Emails per Brand / Sender
                </h2>
                <p className="text-[13px] text-[#666666] mt-1">
                  Breakdown of email counts by sender
                </p>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#111111] sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wider">
                        Brand / Sender
                      </th>
                      <th className="px-6 py-3 text-right text-[12px] font-semibold text-[#888888] uppercase tracking-wider">
                        Emails
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wider w-[200px]">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {brandStats.map((brand, index) => (
                      <tr
                        key={brand.name}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-[13px] text-[#555555]">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-[#fafafa] font-medium">
                            {brand.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[14px] text-[#7c5cff] font-semibold">
                            {brand.count.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#7c5cff] to-[#a78bff] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(brand.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-[12px] text-[#666666] w-[45px] text-right">
                              {brand.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
