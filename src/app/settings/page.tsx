"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Save, Key, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    screenshot_api_access_key: '',
    screenshot_api_secret_key: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      // Save both keys
      const saveAccessKey = fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'screenshot_api_access_key',
          value: settings.screenshot_api_access_key,
        }),
      });

      const saveSecretKey = fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'screenshot_api_secret_key',
          value: settings.screenshot_api_secret_key,
        }),
      });

      const [accessKeyResponse, secretKeyResponse] = await Promise.all([saveAccessKey, saveSecretKey]);

      if (accessKeyResponse.ok && secretKeyResponse.ok) {
        setSaveStatus('success');
        setSaveMessage('✅ Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setSaveMessage('❌ Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
      // Clear status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Settings" breadcrumb={["Dashboard", "Settings"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="Settings" breadcrumb={["Dashboard", "Settings"]} />

      <div className="p-10 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#fafafa] mb-2">Settings</h1>
          <p className="text-[15px] text-[#888888]">
            Configure API keys and integrations
          </p>
        </div>

        {/* Data Sources Section */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-[#7c5cff]" />
            </div>
            <div>
              <h2 className="text-[20px] font-semibold text-[#fafafa]">Data Sources</h2>
              <p className="text-[14px] text-[#888888] mt-1">
                Configure external API integrations
              </p>
            </div>
          </div>

          {/* Screenshot API Keys */}
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-medium text-[#fafafa] mb-2">
                Screenshot API - Access Key
              </label>
              <p className="text-[13px] text-[#888888] mb-3">
                Required for heatmap visualization. Get your free API keys (100 screenshots/month) at{' '}
                <a
                  href="https://screenshotapi.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7c5cff] hover:text-[#6b4fee] inline-flex items-center gap-1"
                >
                  screenshotapi.net
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <input
                type="text"
                value={settings.screenshot_api_access_key}
                onChange={(e) => setSettings({ ...settings, screenshot_api_access_key: e.target.value })}
                placeholder="2E6KAaX6dDYr (example)"
                className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#fafafa] mb-2">
                Screenshot API - Secret Key
              </label>
              <input
                type="password"
                value={settings.screenshot_api_secret_key}
                onChange={(e) => setSettings({ ...settings, screenshot_api_secret_key: e.target.value })}
                placeholder="Nnc5BoaQXEB8 (example)"
                className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all font-mono"
              />
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#7c5cff] flex-shrink-0 mt-0.5" />
                <div className="text-[13px] text-[#888888]">
                  <p className="font-medium text-[#fafafa] mb-1">How to get your API token:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://screenshotapi.net/" target="_blank" rel="noopener noreferrer" className="text-[#7c5cff] hover:underline">screenshotapi.net</a></li>
                    <li>Sign up for free (100 screenshots/month)</li>
                    <li>Copy your API token from the dashboard</li>
                    <li>Paste it here and click "Save Settings"</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>

          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className={`flex items-center gap-2 text-[14px] ${
              saveStatus === 'success' ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'
            }`}>
              {saveStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
