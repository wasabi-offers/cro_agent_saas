"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  Send,
  Loader2,
  Database,
  Sparkles,
  Trash2,
  Bot,
  User,
  Zap,
  TrendingUp,
  Users,
  Search,
  BarChart3,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function EsploraAIPage() {
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
        setConversationHistory(data.conversationHistory);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `❌ Errore: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Errore di connessione al server" },
      ]);
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
      sendMessage();
    }
  };

  const suggestedQueries = [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      text: "Quante email ci sono nel database?",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Users className="w-4 h-4" />,
      text: "Quali sono i top 10 mittenti?",
      color: "from-violet-500 to-purple-500",
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "Analizzami i pattern ricorrenti negli oggetti",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: <Zap className="w-4 h-4" />,
      text: "Trova le email con parole di urgenza",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: <Search className="w-4 h-4" />,
      text: "Quali tecniche promozionali vengono usate?",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: <Database className="w-4 h-4" />,
      text: "Mostrami la distribuzione per giorno della settimana",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      <Sidebar />
      <div className="ml-[280px]">
        <Header />

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative p-4 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-white font-['Space_Grotesk']">
                  Esplora AI
                </h1>
                <p className="text-slate-400 text-sm">
                  Analizza il tuo database email con l&apos;intelligenza artificiale
                </p>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden">
            {/* Messages Area */}
            <div className="h-[550px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-2xl"></div>
                    <div className="relative p-6 bg-gradient-to-br from-[#151515] to-[#0a0a0a] rounded-full border border-[#252525]">
                      <Bot className="w-12 h-12 text-violet-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2 font-['Space_Grotesk']">
                    Come posso aiutarti?
                  </h2>
                  <p className="text-slate-500 mb-8 max-w-md text-center">
                    Chiedimi qualsiasi cosa sui dati delle email. Posso
                    analizzare pattern, trovare trend, confrontare mittenti e
                    molto altro.
                  </p>

                  {/* Suggested Queries Grid */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                    {suggestedQueries.map((query, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(query.text)}
                        className="group flex items-center gap-3 px-4 py-3 bg-[#0f0f0f] hover:bg-[#151515] border border-[#1a1a1a] hover:border-[#252525] rounded-xl transition-all duration-200 text-left"
                      >
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br ${query.color} bg-opacity-20`}
                        >
                          {query.icon}
                        </div>
                        <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                          {query.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-4 ${
                        msg.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-violet-500 to-fuchsia-600"
                            : "bg-[#151515] border border-[#252525]"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-violet-400" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div
                        className={`flex-1 max-w-[85%] ${
                          msg.role === "user" ? "text-right" : ""
                        }`}
                      >
                        <div
                          className={`inline-block rounded-2xl px-5 py-4 ${
                            msg.role === "user"
                              ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white"
                              : "bg-[#0f0f0f] border border-[#1a1a1a] text-slate-100"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <div
                              className="prose prose-invert prose-sm max-w-none
                                prose-headings:text-violet-300 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                                prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
                                prose-strong:text-white
                                prose-code:text-violet-300 prose-code:bg-[#1a1a1a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-[#1a1a1a] prose-pre:rounded-lg
                                prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:my-1
                                prose-table:text-sm prose-table:w-full
                                prose-th:bg-[#151515] prose-th:text-violet-300 prose-th:p-2 prose-th:font-medium prose-th:text-left prose-th:border-b prose-th:border-[#252525]
                                prose-td:p-2 prose-td:border-b prose-td:border-[#1a1a1a] prose-td:text-slate-400
                                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline"
                              dangerouslySetInnerHTML={{
                                __html: formatMarkdown(msg.content),
                              }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-[#151515] border border-[#252525]">
                        <Bot className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-5 py-4">
                        <div className="flex items-center gap-3 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                          <span>Analizzo i dati...</span>
                          <div className="flex gap-1">
                            <div
                              className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#1a1a1a] p-4 bg-[#080808]">
              <div className="flex gap-3 items-end">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-3 text-slate-500 hover:text-white hover:bg-[#151515] rounded-xl transition-colors border border-transparent hover:border-[#252525]"
                    title="Nuova chat"
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
                    placeholder="Chiedi qualcosa sui dati email..."
                    className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none min-h-[48px] max-h-[150px] transition-all"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2 text-center">
                Premi Enter per inviare, Shift+Enter per andare a capo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced markdown formatter
function formatMarkdown(text: string): string {
  return (
    text
      // Code blocks with syntax highlighting placeholder
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        '<pre class="overflow-x-auto"><code class="block p-4">$2</code></pre>'
      )
      // Inline code
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // Headers
      .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Tables
      .replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split("|").map((cell: string) => cell.trim());
        const isHeader = cells.every((cell: string) => /^-+$/.test(cell));
        if (isHeader) return "";
        const cellTag = "td";
        return `<tr>${cells.map((cell: string) => `<${cellTag}>${cell}</${cellTag}>`).join("")}</tr>`;
      })
      // Wrap consecutive table rows in table tags
      .replace(
        /(<tr>.*<\/tr>\n?)+/g,
        '<table class="w-full border-collapse my-4">$&</table>'
      )
      // Bullet lists
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      // Numbered lists
      .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
      // Wrap list items
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      // Paragraphs
      .replace(/\n\n/g, "</p><p>")
      // Line breaks
      .replace(/\n/g, "<br/>")
  );
}

