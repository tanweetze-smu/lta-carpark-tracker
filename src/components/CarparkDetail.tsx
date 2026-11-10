import React, { useState } from 'react';
import { CarparkRecord } from '../types/carpark';
import { 
  X, Bookmark, Navigation, MapPin, Zap, Clock, ShieldCheck, 
  ExternalLink, Copy, Check, DollarSign, AlertCircle, Compass 
} from 'lucide-react';

interface CarparkDetailProps {
  carpark: CarparkRecord | null;
  onClose: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const CarparkDetail: React.FC<CarparkDetailProps> = ({
  carpark,
  onClose,
  onToggleFavorite,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [calcHours, setCalcHours] = useState<number>(2);
  const [calcMinutes, setCalcMinutes] = useState<number>(0);
  const [isSundayDaytime, setIsSundayDaytime] = useState<boolean>(false);

  if (!carpark) return null;

  const { lots, rates, gantryClearanceHeight, evChargers, agency, carparkType, distanceKm } = carpark;
  const availCars = lots.car.available;
  const totalCars = lots.car.total;
  const percentFilled = totalCars > 0 ? Math.round(((totalCars - availCars) / totalCars) * 100) : 0;

  const handleCopyAddress = () => {
    const textToCopy = `${carpark.name}, ${carpark.address}, Singapore ${carpark.postalCode}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Estimate parking fee for duration
  const totalDurationMinutes = calcHours * 60 + calcMinutes;
  let estimatedFee = 0;
  if (totalDurationMinutes <= rates.gracePeriodMins) {
    estimatedFee = 0;
  } else if (isSundayDaytime && rates.sundayFreeParking) {
    estimatedFee = 0;
  } else {
    // Basic standard hourly computation
    const chargeableHalfHours = Math.ceil(totalDurationMinutes / 30);
    const halfHourlyRate = rates.estimatedHourlyPeak / 2;
    estimatedFee = Math.round(chargeableHalfHours * halfHourlyRate * 100) / 100;
  }

  // Navigation Links
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="font-semibold text-emerald-400 font-mono">{carpark.id}</span>
            <span aria-hidden="true">·</span>
            <span>{agency}</span>
            <span aria-hidden="true">·</span>
            <span>{carparkType}</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight line-clamp-2">
            {carpark.name}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{carpark.address}, Singapore {carpark.postalCode}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => onToggleFavorite(carpark.id, e)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              carpark.isFavorite
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Save carpark"
          >
            <Bookmark className={`w-4 h-4 ${carpark.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Real-time Status Card */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Available Car Lots
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-3xl font-extrabold font-mono tabular-nums ${
                  availCars > 30 ? 'text-emerald-400' : availCars > 0 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {availCars}
                </span>
                <span className="text-sm text-slate-400 font-mono">
                  / {totalCars} total capacity
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-slate-400">
                {100 - percentFilled}% free
              </span>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">
                {availCars > 30 ? 'Plenty of Spaces' : availCars > 0 ? 'Limited Capacity' : 'Lot Full'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-300 ${
                availCars > 30 ? 'bg-emerald-500' : availCars > 0 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>

          {/* Other Vehicle Breakdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-xs">
            {lots.motorcycle && (
              <div className="bg-slate-900/60 rounded-lg p-2 font-mono">
                <span className="text-slate-400 block text-[11px]">Motorcycles</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {lots.motorcycle.available}
                </span>
                <span className="text-slate-500 text-[11px]"> / {lots.motorcycle.total}</span>
              </div>
            )}

            {lots.heavyVehicle && (
              <div className="bg-slate-900/60 rounded-lg p-2 font-mono">
                <span className="text-slate-400 block text-[11px]">Heavy Vehicles</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {lots.heavyVehicle.available}
                </span>
                <span className="text-slate-500 text-[11px]"> / {lots.heavyVehicle.total}</span>
              </div>
            )}

            {evChargers && (
              <div className="bg-slate-900/60 rounded-lg p-2 font-mono">
                <span className="text-slate-400 block text-[11px]">EV Charging</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {evChargers.available}
                </span>
                <span className="text-slate-500 text-[11px]"> / {evChargers.count} ports</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Directions / Navigation Actions */}
        <div>
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            One-Tap Navigation Links
          </span>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Waze</span>
            </a>

            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Apple Maps</span>
            </a>
          </div>

          <button
            onClick={handleCopyAddress}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedAddress ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Address Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Full Address & Postal Code</span>
              </>
            )}
          </button>
        </div>

        {/* Pricing & Parking Rates */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Published Parking Charges
            </span>
            <span className="text-xs font-mono text-emerald-400">
              ~${rates.estimatedHourlyPeak.toFixed(2)}/hr peak
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Weekday Day</span>
              <span className="text-slate-200 font-medium text-right">{rates.weekdayDay}</span>
            </div>

            <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Weekday Evening / Night</span>
              <span className="text-slate-200 font-medium text-right">{rates.weekdayNight}</span>
            </div>

            <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Weekends &amp; PH</span>
              <span className="text-slate-200 font-medium text-right">{rates.weekend}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Sunday Free Parking</span>
              <span className={`font-semibold ${rates.sundayFreeParking ? 'text-amber-400' : 'text-slate-400'}`}>
                {rates.sundayFreeParking ? 'Free (7:00 AM – 10:30 PM)' : 'Standard Charges Apply'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Gantry Grace Period</span>
              <span className="text-slate-200 font-mono tabular-nums">
                {rates.gracePeriodMins} minutes free drop-off
              </span>
            </div>
          </div>
        </div>

        {/* Quick Parking Fee Estimator */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold text-slate-200">
              Fee Estimator for this Carpark
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Hours</label>
              <select
                value={calcHours}
                onChange={(e) => setCalcHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((h) => (
                  <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Minutes</label>
              <select
                value={calcMinutes}
                onChange={(e) => setCalcMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{m} mins</option>
                ))}
              </select>
            </div>
          </div>

          {rates.sundayFreeParking && (
            <label className="flex items-center gap-2 text-xs text-slate-300 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSundayDaytime}
                onChange={(e) => setIsSundayDaytime(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>Parking during Sunday daytime (7am–10:30pm)</span>
            </label>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs">
            <span className="text-slate-400">Estimated Total Charge:</span>
            <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
              ${estimatedFee.toFixed(2)} SGD
            </span>
          </div>
        </div>

        {/* Technical & Gantry Specifications */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-slate-300 block">
            Gantry &amp; Operational Specs
          </span>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Clearance Height</span>
              <span className={`font-mono font-bold ${gantryClearanceHeight < 2.0 ? 'text-amber-400' : 'text-slate-100'}`}>
                {gantryClearanceHeight} meters
              </span>
              {gantryClearanceHeight < 2.0 && (
                <span className="text-[10px] text-amber-400 block mt-0.5">Low clearance (tall SUVs check)</span>
              )}
            </div>

            <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Electronic Parking</span>
              <span className="font-semibold text-emerald-400">
                {carpark.electronicParkingSystem ? 'EPS (In-Vehicle Unit)' : 'Manual / Coupon'}
              </span>
            </div>

            <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Short-Term Parking</span>
              <span className="font-medium text-slate-200">{carpark.shortTermParking}</span>
            </div>

            <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Night Parking</span>
              <span className="font-medium text-slate-200">
                {carpark.nightParking ? 'Allowed Overnight' : 'Day Parking Only'}
              </span>
            </div>
          </div>
        </div>

        {/* 12-Hour Hourly Trend Bar */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Typical Daily Occupancy Pattern
            </span>
            <span className="text-[11px] text-slate-500 font-mono">12-hr curve</span>
          </div>

          <div className="flex items-end gap-1.5 h-16 pt-2">
            {carpark.occupancyTrend.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={`w-full rounded-t transition-all ${
                    val > 90 ? 'bg-rose-500' : val > 75 ? 'bg-amber-400' : 'bg-emerald-500/70'
                  }`}
                  style={{ height: `${val}%` }}
                />
                <span className="text-[9px] font-mono text-slate-500">
                  {8 + idx}h
                </span>
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute -top-7 bg-slate-900 border border-slate-700 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-mono z-10">
                  {val}% full
                </div>
              </div>
            ))}
          </div>

          {carpark.peakHourNotes && (
            <div className="mt-3 text-[11px] text-slate-400 bg-slate-800/50 p-2 rounded flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{carpark.peakHourNotes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
