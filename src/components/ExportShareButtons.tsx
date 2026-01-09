"use client";

import { useState } from "react";
import { Download, Share2, Link2, Check, FileText, Mail } from "lucide-react";

interface ExportShareButtonsProps {
  pageUrl: string;
  analysisDate?: string;
}

export default function ExportShareButtons({
  pageUrl,
  analysisDate = new Date().toISOString(),
}: ExportShareButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);

    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, this would generate and download a PDF
    const link = document.createElement('a');
    link.href = '#'; // Would be blob URL in real implementation
    link.download = `cro-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
    // link.click();

    setIsExporting(false);

    // Show success message
    alert('PDF export functionality would trigger here. In production, this would generate a comprehensive PDF report.');
  };

  const handleCopyLink = () => {
    const shareableUrl = `${window.location.origin}/shared-analysis/${btoa(pageUrl)}`;

    navigator.clipboard.writeText(shareableUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`CRO Analysis Report - ${pageUrl}`);
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share this CRO analysis report with you:\n\n${pageUrl}\n\nAnalysis Date: ${new Date(analysisDate).toLocaleDateString()}\n\nBest regards`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Export PDF Button */}
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] border border-[#2a2a2a] text-[#fafafa] rounded-xl text-[13px] font-medium hover:bg-[#1a1a1a] hover:border-[#7c5cff]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export PDF
          </>
        )}
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-[13px] font-medium transition-all ${
          linkCopied
            ? 'bg-[#00d4aa]/20 border-[#00d4aa]/30 text-[#00d4aa]'
            : 'bg-[#111111] border-[#2a2a2a] text-[#fafafa] hover:bg-[#1a1a1a] hover:border-[#7c5cff]/50'
        }`}
      >
        {linkCopied ? (
          <>
            <Check className="w-4 h-4" />
            Link Copied!
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Copy Link
          </>
        )}
      </button>

      {/* Share Menu */}
      <div className="relative">
        <button
          onClick={() => setShareMenuOpen(!shareMenuOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl text-[13px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>

        {/* Share Dropdown */}
        {shareMenuOpen && (
          <div className="absolute right-0 top-12 w-64 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
            <div className="p-3 border-b border-[#2a2a2a]">
              <h4 className="text-[13px] font-semibold text-[#fafafa]">Share Analysis</h4>
            </div>

            <div className="p-2">
              {/* Email Share */}
              <button
                onClick={() => {
                  handleEmailShare();
                  setShareMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#111111] transition-all text-left"
              >
                <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#7c5cff]" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#fafafa]">Email</div>
                  <div className="text-[11px] text-[#666666]">Share via email</div>
                </div>
              </button>

              {/* Generate Report Link */}
              <button
                onClick={() => {
                  handleCopyLink();
                  setShareMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#111111] transition-all text-left"
              >
                <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-[#00d4aa]" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#fafafa]">Copy Link</div>
                  <div className="text-[11px] text-[#666666]">Share with a link</div>
                </div>
              </button>

              {/* PDF Report */}
              <button
                onClick={() => {
                  handleExportPDF();
                  setShareMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#111111] transition-all text-left"
              >
                <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#fafafa]">PDF Report</div>
                  <div className="text-[11px] text-[#666666]">Download as PDF</div>
                </div>
              </button>
            </div>

            <div className="p-3 border-t border-[#2a2a2a] bg-[#111111]/50">
              <p className="text-[11px] text-[#666666] text-center">
                Share this analysis with your team
              </p>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {shareMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShareMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
