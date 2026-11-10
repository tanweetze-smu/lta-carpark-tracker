import React from 'react';
import { CarparkRecord } from '../types/carpark';
import { Bookmark, Navigation, ArrowUpDown, Zap, ArrowUpRight } from 'lucide-react';

interface CarparkTableProps {
  carparks: CarparkRecord[];
  selectedCarpark: CarparkRecord | null;
  onSelectCarpark: (carpark: CarparkRecord) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const CarparkTable: React.FC<CarparkTableProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  onToggleFavorite,
}) => {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/80">
            <tr>
              <th scope="col" className="py-3 px-3 w-10 text-center">★</th>
              <th scope="col" className="py-3 px-3 min-w-[200px]">Carpark &amp; District</th>
              <th scope="col" className="py-3 px-3">Agency</th>
              <th scope="col" className="py-3 px-4 min-w-[170px]">Available Lots</th>
              <th scope="col" className="py-3 px-3 text-right">Distance</th>
              <th scope="col" className="py-3 px-3 text-right">Peak Rate</th>
              <th scope="col" className="py-3 px-3 text-center">Clearance</th>
              <th scope="col" className="py-3 px-3 text-center">EV Spots</th>
              <th scope="col" className="py-3 px-3 text-center">Sunday Free</th>
              <th scope="col" className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {carparks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  No carparks match your filter criteria. Try clearing some filters.
                </td>
              </tr>
            ) : (
              carparks.map((cp) => {
                const avail = cp.lots.car.available;
                const total = cp.lots.car.total;
                const percent = total > 0 ? Math.round(((total - avail) / total) * 100) : 0;
                const isSelected = selectedCarpark?.id === cp.id;

                let availColor = 'text-emerald-400';
                let barColor = 'bg-emerald-500';
                if (avail === 0) {
                  availColor = 'text-rose-400';
                  barColor = 'bg-rose-500';
                } else if (avail < 30) {
                  availColor = 'text-amber-400';
                  barColor = 'bg-amber-400';
                }

                return (
                  <tr
                    key={cp.id}
                    onClick={() => onSelectCarpark(cp)}
                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-800/80 ring-1 ring-emerald-500/30' : ''
                    }`}
                  >
                    {/* Favorite */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => onToggleFavorite(cp.id, e)}
                        className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                        title={cp.isFavorite ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${cp.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white hover:text-emerald-400 transition-colors">
                        {cp.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {cp.district} · {cp.postalCode}
                      </div>
                    </td>

                    {/* Agency */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-slate-300 font-medium">
                        {cp.agency}
                      </span>
                    </td>

                    {/* Available Lots */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-mono font-bold tabular-nums ${availColor}`}>
                          {avail}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          / {total} ({100 - percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    {/* Distance */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      {cp.distanceKm !== undefined ? `${cp.distanceKm} km` : '-'}
                    </td>

                    {/* Peak Rate */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                      ${cp.rates.estimatedHourlyPeak.toFixed(2)}
                    </td>

                    {/* Clearance */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={cp.gantryClearanceHeight < 2.0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {cp.gantryClearanceHeight}m
                      </span>
                    </td>

                    {/* EV */}
                    <td className="py-3 px-3 text-center">
                      {cp.evChargers && cp.evChargers.count > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono text-emerald-400">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{cp.evChargers.available}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Sunday Free */}
                    <td className="py-3 px-3 text-center">
                      {cp.rates.sundayFreeParking ? (
                        <span className="text-amber-400 font-semibold">Yes</span>
                      ) : (
                        <span className="text-slate-600">No</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${cp.coordinates.lat},${cp.coordinates.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Open navigation directions"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onSelectCarpark(cp)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="View detailed stats"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
