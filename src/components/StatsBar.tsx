import React from 'react';
import { CarparkRecord } from '../types/carpark';
import { Car, Zap, Clock, ShieldCheck, MapPin } from 'lucide-react';

interface StatsBarProps {
  carparks: CarparkRecord[];
  lastUpdated: Date;
  countdownSecs: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedLocationLabel: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  carparks,
  lastUpdated,
  countdownSecs,
  onRefresh,
  isRefreshing,
  selectedLocationLabel,
}) => {
  const totalCarLots = carparks.reduce((acc, c) => acc + c.lots.car.total, 0);
  const availableCarLots = carparks.reduce((acc, c) => acc + c.lots.car.available, 0);
  const percentAvailable = totalCarLots > 0 ? Math.round((availableCarLots / totalCarLots) * 100) : 0;
  
  const totalEvHubs = carparks.filter((c) => c.evChargers && c.evChargers.count > 0).length;
  const totalEvChargers = carparks.reduce((acc, c) => acc + (c.evChargers?.available || 0), 0);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6">
          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Carparks:</span>
              <span className="font-semibold text-white font-mono">{carparks.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Available Car Lots:</span>
              <span className="font-semibold text-emerald-400 font-mono tabular-nums">
                {availableCarLots.toLocaleString()}
              </span>
              <span className="text-slate-500">/ {totalCarLots.toLocaleString()}</span>
              <span className="text-slate-500 font-mono">({percentAvailable}% open)</span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">EV Available:</span>
              <span className="font-semibold text-white font-mono tabular-nums">
                {totalEvChargers}
              </span>
              <span className="text-slate-500">across {totalEvHubs} stations</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Reference Point:</span>
              <span className="text-slate-200 font-medium">{selectedLocationLabel}</span>
            </div>
          </div>

          {/* Sync & Timestamp Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Next update:</span>
              <span className="font-mono text-slate-200 tabular-nums">{countdownSecs}s</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRefreshing ? 'Updating...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
