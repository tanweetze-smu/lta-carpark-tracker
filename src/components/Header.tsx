import React from 'react';
import { Database, RefreshCw, Bookmark, SlidersHorizontal, Calculator } from 'lucide-react';

interface HeaderProps {
  activeTab: 'explore' | 'saved' | 'calculator';
  setActiveTab: (tab: 'explore' | 'saved' | 'calculator') => void;
  favoritesCount: number;
  onOpenBackendModal: () => void;
  onRefreshLots: () => void;
  isRefreshing: boolean;
  isFromLiveBackend: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
  onOpenBackendModal,
  onRefreshLots,
  isRefreshing,
  isFromLiveBackend,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single element, clean display) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
            P
          </div>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-left group cursor-pointer"
          >
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
              ParkSG
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-normal">
              Singapore Real-Time Availability
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation links (single line, clean text with hover underline) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('explore')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
              activeTab === 'explore'
                ? 'text-white border-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Live Availability
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
              activeTab === 'saved'
                ? 'text-white border-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Carparks</span>
            {favoritesCount > 0 && (
              <span className="ml-1 text-xs font-mono text-emerald-400">
                ({favoritesCount})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
              activeTab === 'calculator'
                ? 'text-white border-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Rate Calculator</span>
          </button>

          <button
            onClick={onRefreshLots}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Refresh lots availability"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync Lots</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile view tab buttons */}
          <div className="flex md:hidden items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab('explore')}
              className={`p-1.5 rounded-md text-xs font-medium ${
                activeTab === 'explore' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
              title="Explore"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`p-1.5 rounded-md text-xs font-medium ${
                activeTab === 'saved' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
              title="Saved"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`p-1.5 rounded-md text-xs font-medium ${
                activeTab === 'calculator' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
              title="Calculator"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenBackendModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all whitespace-nowrap cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isFromLiveBackend ? 'Backend Connected' : 'API Connection'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
