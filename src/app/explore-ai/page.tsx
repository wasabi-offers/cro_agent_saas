"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import {
  Brain,
  Send,
  Sparkles,
  BarChart3,
  AlertTriangle,
  FlaskConical,
  RefreshCw,
  User,
  Loader2,
  Lightbulb,
  Target,
  Trash2,
  Smartphone,
  Monitor,
  TrendingUp,
  MousePointerClick,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  query: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: "overview",
    label: "CRO Overview",
    description: "Summary of key data and metrics",
    query: "Give me a complete CRO overview: sessions, users, engagement metrics and UX issues.",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "#7c5cff",
  },
  {
    id: "ux-issues",
    label: "UX Issues",
    description: "Dead clicks, rage clicks, quickbacks",
    query: "Analyze the detected UX issues. Which are the most critical? How do I fix them?",
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "#ff6b6b",
  },
  {
    id: "ab-tests",
    label: "A/B Test Suggestions",
    description: "Prioritized tests to launch",
    query: "Suggest 5 A/B tests to launch based on current data. For each test I want: name, hypothesis, priority and expected impact.",
    icon: <FlaskConical className="w-5 h-5" />,
    color: "#00d4aa",
  },
  {
    id: "mobile",
    label: "Mobile Analysis",
    description: "Performance and issues on mobile",
    query: "Analyze mobile performance in detail. What are the specific issues? How can I improve mobile conversions?",
    icon: <Smartphone className="w-5 h-5" />,
    color: "#f59e0b",
  },
  {
    id: "compare",
    label: "Mobile vs Desktop",
    description: "Device comparison",
    query: "Compare Mobile vs Desktop performance. What are the main differences? Where should I focus my efforts?",
    icon: <Monitor className="w-5 h-5" />,
    color: "#8b5cf6",
  },
  {
    id: "blockers",
    label: "Conversion Blockers",
    description: "What prevents conversions",
    query: "Identify the main conversion blockers. What negative patterns do you see in the data? How do I fix them?",
    icon: <Target className="w-5 h-5" />,
    color: "#ec4899",
  },
];

const suggestedQuestions = [
  "What are the top 3 critical issues to fix immediately?",
  "How many sessions and users do I have? How are they split by device?",
  "Why are users rage clicking? How do I solve it?",
  "Which pages have the most dead clicks?",
  "How can I improve mobile engagement rate?",
  "What is my #1 priority to improve conversions?",
  "Show me traffic statistics by device",
  "Are there any data anomalies I should investigate?",
];

export default function ExploreAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<unknown[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = 
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationHistory,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setConversationHistory(result.conversationHistory);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ Error: ${result.error || "Unable to get analysis. Please try again."}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Connection error. Please check that the server is running and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Markdown to HTML converter
  const formatMarkdown = (text: string): string => {
    return text
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-[#1a1a1a] p-4 rounded-lg overflow-x-auto my-3"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-[#00d4aa]">$1</code>')
      // Headers
      .replace(/^#### (.*$)/gm, '<h4 class="text-[15px] font-semibold text-[#fafafa] mt-4 mb-2">$1</h4>')
      .replace(/^### (.*$)/gm, '<h3 class="text-[16px] font-semibold text-[#fafafa] mt-5 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-[18px] font-bold text-[#fafafa] mt-6 mb-3 pb-2 border-b border-white/10">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-[20px] font-bold text-[#fafafa] mt-6 mb-3">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="text-[#fafafa]"><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#fafafa]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.every(c => c.trim().match(/^[-:]+$/))) {
          return ''; // Skip separator row
        }
        const cellHtml = cells.map(c => 
          `<td class="px-3 py-2 border-b border-white/10">${c.trim()}</td>`
        ).join('');
        return `<tr class="border-b border-white/5">${cellHtml}</tr>`;
      })
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-4 border-white/10" />')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header title="Explore AI" breadcrumb={["Explore AI"]} />

      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages or Empty State */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="max-w-4xl mx-auto">
                {/* Welcome */}
                <div className="text-center mb-10 pt-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-[28px] font-bold text-[#fafafa] mb-3">
                    Explore AI
                  </h1>
                  <p className="text-[16px] text-[#888888] max-w-lg mx-auto">
                    Query your CRO data using natural language. 
                    Ask questions, get insights and actionable recommendations.
                  </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => sendMessage(action.query)}
                      disabled={isLoading}
                      className="p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl hover:border-white/20 transition-all text-left group disabled:opacity-50"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${action.color}20` }}
                      >
                        <div style={{ color: action.color }}>{action.icon}</div>
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#fafafa] mb-1">
                        {action.label}
                      </h3>
                      <p className="text-[13px] text-[#888888]">
                        {action.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Suggested Questions */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-[#f59e0b]" />
                    <h3 className="text-[15px] font-medium text-[#fafafa]">
                      Suggested Questions
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(question)}
                        disabled={isLoading}
                        className="p-3 bg-[#111111] border border-white/5 rounded-xl hover:border-[#7c5cff]/50 hover:bg-[#151515] transition-all text-left text-[13px] text-[#d4d4d4] disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="mt-10 grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <MousePointerClick className="w-6 h-6 text-[#7c5cff]" />
                    </div>
                    <p className="text-[13px] text-[#888888]">
                      Real-time UX analysis
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#00d4aa]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-[#00d4aa]" />
                    </div>
                    <p className="text-[13px] text-[#888888]">
                      Data-driven suggestions
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-[#f59e0b]" />
                    </div>
                    <p className="text-[13px] text-[#888888]">
                      Conversational responses
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-5 ${
                        message.role === "user"
                          ? "bg-[#7c5cff] text-white"
                          : "bg-[#0a0a0a] border border-white/10 text-[#d4d4d4]"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div 
                          className="prose prose-invert prose-sm max-w-none text-[14px] leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: formatMarkdown(message.content) 
                          }} 
                        />
                      ) : (
                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                      <p
                        className={`text-[11px] mt-3 ${
                          message.role === "user"
                            ? "text-white/60"
                            : "text-[#666666]"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-10 h-10 bg-[#333333] rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#888888]" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-[#7c5cff] animate-spin" />
                        <span className="text-[14px] text-[#888888]">
                          Analyzing CRO data...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 p-6 bg-black">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-3 text-[#666666] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-xl transition-all"
                    title="New conversation"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask something about your CRO data..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-[#fafafa] placeholder-[#666666] focus:outline-none focus:border-[#7c5cff]/50 resize-none"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="px-5 py-3 bg-[#7c5cff] text-white rounded-xl text-[14px] font-medium hover:bg-[#6b4ee0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Quick action buttons when in chat */}
              {messages.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {quickActions.slice(0, 4).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => sendMessage(action.query)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-[#111111] border border-white/10 rounded-lg text-[12px] text-[#888888] hover:text-[#fafafa] hover:border-white/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <div style={{ color: action.color }}>
                        {action.icon}
                      </div>
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Info */}
        <div className="w-80 border-l border-white/10 bg-[#0a0a0a] p-6 hidden lg:block overflow-y-auto">
          <div className="sticky top-0">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-[#7c5cff]" />
              <h3 className="text-[15px] font-semibold text-[#fafafa]">
                How It Works
              </h3>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-[#111111] border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center text-[12px] font-bold text-[#7c5cff]">
                    1
                  </div>
                  <p className="text-[13px] font-medium text-[#fafafa]">
                    Ask a question
                  </p>
                </div>
                <p className="text-[12px] text-[#888888] ml-8">
                  Write in natural language what you want to know about your data
                </p>
              </div>

              <div className="p-4 bg-[#111111] border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center text-[12px] font-bold text-[#00d4aa]">
                    2
                  </div>
                  <p className="text-[13px] font-medium text-[#fafafa]">
                    AI analyzes
                  </p>
                </div>
                <p className="text-[12px] text-[#888888] ml-8">
                  Claude queries the Clarity database with intelligent queries
                </p>
              </div>

              <div className="p-4 bg-[#111111] border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center text-[12px] font-bold text-[#f59e0b]">
                    3
                  </div>
                  <p className="text-[13px] font-medium text-[#fafafa]">
                    Get insights
                  </p>
                </div>
                <p className="text-[12px] text-[#888888] ml-8">
                  Receive detailed analysis and actionable recommendations
                </p>
              </div>
            </div>

            {/* Tools Available */}
            <div className="mb-6">
              <h4 className="text-[13px] font-medium text-[#888888] mb-3 uppercase tracking-wide">
                Available Data
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[12px] text-[#666666]">
                  <div className="w-1.5 h-1.5 bg-[#7c5cff] rounded-full" />
                  Sessions and users by device
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#666666]">
                  <div className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full" />
                  Dead clicks, rage clicks, quickbacks
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#666666]">
                  <div className="w-1.5 h-1.5 bg-[#00d4aa] rounded-full" />
                  Engagement and time on page
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#666666]">
                  <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full" />
                  Script errors and technical issues
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#666666]">
                  <div className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full" />
                  Bot traffic
                </div>
              </div>
            </div>

            {/* Powered by */}
            <div className="p-4 bg-gradient-to-br from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-[#7c5cff]" />
                <p className="text-[12px] font-medium text-[#fafafa]">
                  Powered by Claude AI
                </p>
              </div>
              <p className="text-[11px] text-[#888888]">
                Agentic Loop with Tool Use for intelligent queries on Supabase database
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
