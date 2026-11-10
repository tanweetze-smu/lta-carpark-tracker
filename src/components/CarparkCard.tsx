import React from 'react';
import { CarparkRecord } from '../types/carpark';
import { Bookmark, Navigation, Zap, Shield, ArrowUpRight } from 'lucide-react';

interface CarparkCardProps {
  carpark: CarparkRecord;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  onSelect,
  onToggleFavorite,
}) => {
  const { lots, rates, gantryClearanceHeight, evChargers, agency, carparkType, distanceKm } = carpark;
  const avail = lots.car.available;
  const total = lots.car.total;
  const percentFilled = total > 0 ? Math.round(((total - avail) / total) * 100) : 0;

  // Status color & copy
  let statusText = 'Available';
  let statusTextColor = 'text-emerald-400';
  let barColor = 'bg-emerald-500';

  if (avail === 0) {
    statusText = 'Full / Queuing';
    statusTextColor = 'text-rose-400';
    barColor = 'bg-rose-500';
  } else if (avail < 30) {
    statusText = 'Limited Lots';
    statusTextColor = 'text-amber-400';
    barColor = 'bg-amber-400';
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl p-4 transition-all duration-150 cursor-pointer border ${
        isSelected
          ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
          : 'bg-slate-900/80 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header Row: Title & Bookmark */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 text-sm sm:text-base group-hover:text-emerald-400 transition-colors line-clamp-1">
            {carpark.name}
          </h3>
          
          {/* Unboxed Metadata with Typographic Separator */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <span className="font-medium text-slate-300">{agency}</span>
            <span aria-hidden="true">·</span>
            <span>{carparkType}</span>
            <span aria-hidden="true">·</span>
            <span>{gantryClearanceHeight}m height</span>
            {distanceKm !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-mono tabular-nums">{distanceKm} km away</span>
              </>
            )}
          </div>
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={(e) => onToggleFavorite(carpark.id, e)}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
            carpark.isFavorite
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
          }`}
          title={carpark.isFavorite ? 'Remove from saved' : 'Save carpark'}
        >
          <Bookmark className={`w-4 h-4 ${carpark.isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Lot Availability Metric Block */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold font-mono tabular-nums ${statusTextColor}`}>
              {avail.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">
              car lots free of <span className="font-mono tabular-nums text-slate-300">{total}</span>
            </span>
          </div>
          <span className={`text-xs font-semibold ${statusTextColor}`}>
            {statusText}
          </span>
        </div>

        {/* Linear Capacity Meter */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${percentFilled}%` }}
          />
        </div>
      </div>

      {/* Secondary Vehicle / Rates Strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {lots.motorcycle && (
            <span className="font-mono tabular-nums">
              🏍️ {lots.motorcycle.available} bikes
            </span>
          )}

          {evChargers && evChargers.count > 0 && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{evChargers.available} EV free</span>
            </span>
          )}

          {rates.sundayFreeParking && (
            <span className="text-amber-300 font-medium">
              Sun Free
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-mono">
            ~${rates.estimatedHourlyPeak.toFixed(2)}/hr
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};
