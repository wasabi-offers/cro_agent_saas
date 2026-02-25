"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { TrendingUp, Mail, Lock, ArrowRight, UserPlus, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess("Check your email for the confirmation link.");
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <div className="w-full max-w-[440px] mx-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-[#F97316] to-[#3b82f6] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[22px] leading-tight" style={{ color: "var(--text-primary)" }}>CRO Agent</span>
            <span className="text-[13px]" style={{ color: "var(--text-faint)" }}>Conversion Optimizer</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}>
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl p-1 mb-8" style={{ backgroundColor: "var(--bg-tertiary)" }}>
            <button
              onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-medium transition-all"
              style={{
                backgroundColor: mode === "login" ? "var(--bg-card)" : "transparent",
                color: mode === "login" ? "var(--text-primary)" : "var(--text-faint)",
                boxShadow: mode === "login" ? "var(--shadow-sm)" : "none",
              }}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-medium transition-all"
              style={{
                backgroundColor: mode === "register" ? "var(--bg-card)" : "transparent",
                color: mode === "register" ? "var(--text-primary)" : "var(--text-faint)",
                boxShadow: mode === "register" ? "var(--shadow-sm)" : "none",
              }}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          <h2 className="text-[20px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-faint)" }}>
            {mode === "login"
              ? "Sign in to access your CRO dashboard"
              : "Start optimizing your conversions today"}
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p className="text-[13px] text-blue-600">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-faint)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-faint)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Min. 6 characters" : "Enter your password"}
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#F97316] to-[#C2410C] hover:opacity-90 disabled:opacity-50 text-white text-[15px] font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] mt-6" style={{ color: "var(--text-faint)" }}>
          Powered by CRO Agent &mdash; AI Conversion Optimization
        </p>
      </div>
    </div>
  );
}
