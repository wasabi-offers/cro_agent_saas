"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  source?: "rag-cro" | "claude";
}

interface AppContext {
  currentPage?: string;
  funnels?: any[];
  analytics?: any;
  heatmaps?: any;
  userQuery?: string;
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "👋 Hi! I'm your CRO AI Assistant powered by Claude. I have access to all your funnel data, analytics, heatmaps, and A/B tests. Ask me anything about conversion optimization!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gather context from current page and localStorage
  const gatherContext = (): AppContext => {
    const context: AppContext = {
      currentPage: pathname,
    };

    // Try to get data from localStorage (where mock data might be stored)
    if (typeof window !== 'undefined') {
      try {
        // Get any stored funnel data
        const storedFunnels = localStorage.getItem('funnels');
        if (storedFunnels) {
          context.funnels = JSON.parse(storedFunnels);
        }

        // Get analytics data
        const storedAnalytics = localStorage.getItem('analytics');
        if (storedAnalytics) {
          context.analytics = JSON.parse(storedAnalytics);
        }
      } catch (e) {
        console.error('Error gathering context:', e);
      }
    }

    // Add page-specific context
    if (pathname.includes('/funnels')) {
      context.userQuery = "User is viewing conversion funnels page";
    } else if (pathname.includes('/analytics')) {
      context.userQuery = "User is viewing analytics page with anomaly detection and predictions";
    } else if (pathname.includes('/heatmaps')) {
      context.userQuery = "User is viewing heatmaps with session replay";
    } else if (pathname.includes('/ab-tests')) {
      context.userQuery = "User is viewing A/B tests page";
    } else if (pathname === '/') {
      context.userQuery = "User is on dashboard with health score and alerts";
    }

    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Gather context from current page
      const context = gatherContext();

      // Call our API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.message,
        timestamp: new Date(),
        source: data.source,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      // Fallback message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I apologize, but I'm having trouble connecting right now. Please check your API key configuration in the .env.local file. In the meantime, I can tell you that based on industry best practices:\n\n• Focus on reducing friction in your checkout flow\n• Test one variable at a time in A/B tests\n• Mobile optimization is crucial (60%+ traffic is mobile)\n• Page load speed under 2s significantly improves conversions",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suggested questions based on current page
  const getSuggestedQuestions = () => {
    if (pathname.includes('/funnels')) {
      return [
        "How can I reduce drop-off in my checkout funnel?",
        "What's a good conversion rate for my industry?",
        "Where should I add trust signals?",
      ];
    } else if (pathname.includes('/analytics')) {
      return [
        "What do these anomalies mean?",
        "How accurate are the predictions?",
        "What metrics should I focus on?",
      ];
    } else if (pathname.includes('/heatmaps')) {
      return [
        "What do rage clicks indicate?",
        "How do I interpret scroll depth?",
        "What changes should I test first?",
      ];
    } else {
      return [
        "What's my biggest optimization opportunity?",
        "How do I improve my conversion rate?",
        "Should I run an A/B test or make the change directly?",
      ];
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#F97316] to-[#3b82f6] rounded-full shadow-2xl shadow-orange-500/20 flex items-center justify-center hover:scale-110 transition-all z-50 group"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#3b82f6] rounded-full animate-pulse border-2 border-black" />

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-white border border-[#2a2a2a] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            <p className="text-[12px] text-[#1a1a1a] font-medium">Ask CRO AI Assistant</p>
            <p className="text-[10px] text-[#666666]">Powered by Claude</p>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-white border-2 border-[#2a2a2a] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#F97316] to-[#3b82f6] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white">CRO AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-pulse"></div>
                  <p className="text-[11px] text-white/90">Online · Claude AI</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-[#F97316] to-[#3b82f6] text-white'
                      : 'bg-[#f8f9fa] text-[#1a1a1a] border border-[#2a2a2a]'
                  }`}
                >
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center gap-2 mt-1 flex-wrap ${
                    message.type === 'user' ? 'text-white/70' : 'text-[#666666]'
                  }`}>
                    <span className="text-[10px]">
                      {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.type === 'assistant' && message.source && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e0e0e0] text-[#888888]">
                        Source: {message.source === 'rag-cro' ? 'RAG' : 'Claude'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#f8f9fa] border border-[#2a2a2a] rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#F97316] animate-spin" />
                  <span className="text-[13px] text-[#888888]">Claude is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-[11px] text-[#666666] mb-2">Suggested questions:</p>
              <div className="space-y-2">
                {getSuggestedQuestions().map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(question)}
                    className="w-full text-left px-3 py-2 bg-[#f8f9fa] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888888] hover:text-[#1a1a1a] hover:border-[#F97316]/50 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-[#2a2a2a] bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about CRO, metrics, funnels, tests..."
                rows={2}
                className="flex-1 px-4 py-3 bg-[#f8f9fa] border border-[#2a2a2a] rounded-xl text-[#1a1a1a] text-[14px] placeholder:text-[#666666] focus:outline-none focus:border-[#F97316] transition-all resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-r from-[#F97316] to-[#3b82f6] rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-[#666666] mt-2 text-center">
              Powered by Claude AI · Real-time CRO Analysis
            </p>
          </div>
        </div>
      )}
    </>
  );
}
