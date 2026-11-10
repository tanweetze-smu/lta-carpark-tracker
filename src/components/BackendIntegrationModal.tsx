import React, { useState } from 'react';
import { ApiConfig, CarparkService } from '../services/carparkService';
import { X, Database, Check, AlertCircle, Code, Copy, RefreshCw, Radio } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<ApiConfig>(CarparkService.getApiConfig());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'schema' | 'express'>('settings');

  if (!isOpen) return null;

  const handleSave = () => {
    CarparkService.saveApiConfig(config);
    onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging endpoint...');
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        headers['AccountKey'] = config.apiKey;
      }

      const res = await fetch(config.customBackendUrl, { headers });
      const elapsed = Math.round(performance.now() - startTime);

      if (!res.ok) {
        setTestStatus('error');
        setTestMessage(`HTTP ${res.status}: ${res.statusText} (${elapsed}ms)`);
        return;
      }

      const data = await res.json();
      const count = Array.isArray(data) ? data.length : data.items?.length || data.value?.length || 0;
      setTestStatus('success');
      setTestMessage(`Connected successfully! Returned ${count} carparks in ${elapsed}ms.`);
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : 'Failed to connect to endpoint');
    }
  };

  const sampleExpressSnippet = `// Serverless LTA DataMall Endpoints
// Files: /api/carparkavailability.ts & /api/health.ts
//
// 1. Live carpark lots (HDB + LTA + URA):
// GET /api/carparkavailability
// Hits: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
// Header: AccountKey: process.env.LTA_DATAMALL_KEY
//
// 2. Health check:
// GET /api/health
//
// In server.ts:
// app.get('/api/health', (req, res) => healthHandler(req, res));
// app.get('/api/carparkavailability', (req, res) => carparkAvailabilityHandler(req, res));`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(sampleExpressSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Backend Connection Hub
              </h2>
              <p className="text-xs text-slate-400">
                Configure your API endpoint for data.gov.sg &amp; LTA DataMall integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('express')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'express'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Express Proxy Snippet
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'schema'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Official SG API Feeds
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Mode Selection */}
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2.5">
                <span className="font-semibold text-slate-200 block text-xs">
                  Data Feed Provider Mode
                </span>
                
                <label className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={!config.useCustomBackend}
                    onChange={() => setConfig((p) => ({ ...p, useCustomBackend: false }))}
                    className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-white block">
                      Frontend Standalone + Real-Time Simulation (Active)
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Uses realistic preloaded Singapore carparks (HDB, URA, Malls, Hospitals) with live lot drift fluctuations. Zero backend required right now.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={config.useCustomBackend}
                    onChange={() => setConfig((p) => ({ ...p, useCustomBackend: true }))}
                    className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-white block">
                      Connect to Custom Live Backend
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Fetch real-time data from your Express backend, Cloud Run microservice, or local proxy route.
                    </span>
                  </div>
                </label>
              </div>

              {/* Endpoint Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Custom Backend REST Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={config.customBackendUrl}
                    onChange={(e) => setConfig((p) => ({ ...p, customBackendUrl: e.target.value }))}
                    placeholder="/api/carparks or http://localhost:3000/api/carparks"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Endpoint should return a JSON array of carparks matching <code>CarparkRecord</code> or <code>{`{ items: [...] }`}</code>.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    API Key / Bearer Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig((p) => ({ ...p, apiKey: e.target.value }))}
                    placeholder="Optional AccountKey or Bearer token"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Auto-Refresh Polling Interval
                  </label>
                  <select
                    value={config.autoRefreshIntervalSecs}
                    onChange={(e) => setConfig((p) => ({ ...p, autoRefreshIntervalSecs: Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value={15}>15 seconds (High Frequency)</option>
                    <option value={30}>30 seconds (Recommended)</option>
                    <option value={60}>60 seconds (Matches data.gov.sg 1-min update)</option>
                    <option value={120}>2 minutes</option>
                  </select>
                </div>
              </div>

              {/* Test Connection Button */}
              {config.useCustomBackend && (
                <div className="pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing' || !config.customBackendUrl}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Test Connection to Endpoint</span>
                  </button>

                  {testStatus !== 'idle' && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        testStatus === 'success'
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                          : testStatus === 'error'
                          ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {testStatus === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{testMessage}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'express' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  Ready-to-Use Express Proxy Example
                </span>
                <button
                  onClick={copyCodeToClipboard}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-x-auto text-slate-300 font-mono text-[11px] leading-relaxed">
                <pre>{sampleExpressSnippet}</pre>
              </div>

              <p className="text-slate-400 text-[11px]">
                When you are ready to integrate your backend server, add this route in your <code>server.ts</code> to securely proxy the requests and bypass browser CORS restrictions.
              </p>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
                <span className="font-semibold text-emerald-400 block">1. data.gov.sg (HDB &amp; URA Availability)</span>
                <p className="text-slate-400">
                  Endpoint: <code>https://api.data.gov.sg/v1/transport/carpark-availability</code>
                </p>
                <p className="text-slate-400">
                  Updated every 1 minute. Free public API, no authentication required. Returns carpark numbers with total and available lots for Cars (C), Motorcycles (Y), and Heavy Vehicles (H).
                </p>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
                <span className="font-semibold text-emerald-400 block">2. LTA DataMall (Shopping Malls &amp; Commercial)</span>
                <p className="text-slate-400">
                  Endpoint: <code>http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2</code>
                </p>
                <p className="text-slate-400">
                  Covers commercial buildings like Suntec City, ION Orchard, Marina Bay Sands, VivoCity, and Jewel Changi. Requires an <code>AccountKey</code> header.
                </p>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
                <span className="font-semibold text-emerald-400 block">3. OneMap Singapore (Reverse Geocoding &amp; Coordinates)</span>
                <p className="text-slate-400">
                  Used for converting SVY21 coordinates to WGS84 Lat/Lng and searching postal codes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
