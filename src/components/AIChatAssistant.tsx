"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hi! I'm your CRO AI Assistant. Ask me anything about conversion optimization, A/B testing, or your current metrics!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your current data, I'd recommend focusing on reducing the bounce rate on mobile. It's 15% higher than desktop.",
        "Your checkout funnel shows a 60% drop-off at the 'Add to Cart' step. Consider implementing trust badges and reducing friction.",
        "The best time to run your A/B test would be Monday-Thursday when you have consistent traffic. Avoid weekends for statistical accuracy.",
        "I've analyzed your heatmaps - users are clicking on non-interactive elements. Consider making those clickable CTAs.",
        "Your current conversion rate is below industry average. Quick wins: optimize mobile form fields and add social proof above the fold."
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-full shadow-2xl shadow-purple-500/20 flex items-center justify-center hover:scale-110 transition-all z-50 group"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff6b6b] rounded-full animate-pulse" />

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <p className="text-[12px] text-[#fafafa]">Ask CRO AI Assistant</p>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-[#0a0a0a] border-2 border-[#2a2a2a] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white">CRO AI Assistant</h3>
                <p className="text-[11px] text-white/80">Online · Ready to help</p>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white'
                      : 'bg-[#111111] text-[#fafafa] border border-[#2a2a2a]'
                  }`}
                >
                  <p className="text-[14px] leading-relaxed">{message.content}</p>
                  <p className={`text-[10px] mt-1 ${
                    message.type === 'user' ? 'text-white/70' : 'text-[#666666]'
                  }`}>
                    {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-[#7c5cff] animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about CRO, metrics, tests..."
                className="flex-1 px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[14px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-[#666666] mt-2 text-center">
              Powered by Claude AI · Expert CRO Knowledge
            </p>
          </div>
        </div>
      )}
    </>
  );
}
