import React, { useState } from 'react';
import { CarparkRecord } from '../types/carpark';
import { X, Calculator, DollarSign, Clock, ShieldCheck, Car, HelpCircle } from 'lucide-react';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  carparks: CarparkRecord[];
  initialCarparkId?: string;
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  isOpen,
  onClose,
  carparks,
  initialCarparkId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialCarparkId || (carparks[0] ? carparks[0].id : '')
  );
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [hours, setHours] = useState<number>(2);
  const [minutes, setMinutes] = useState<number>(30);
  const [isOvernight, setIsOvernight] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentCarpark = carparks.find((c) => c.id === selectedId) || carparks[0];

  // Calculation Logic
  const totalDurationMinutes = hours * 60 + minutes;
  let breakdownNotes: string[] = [];
  let calculatedCost = 0;

  if (currentCarpark) {
    const { rates, agency } = currentCarpark;

    if (totalDurationMinutes <= rates.gracePeriodMins) {
      calculatedCost = 0;
      breakdownNotes.push(`Within ${rates.gracePeriodMins}-minute grace period (No charge).`);
    } else if (dayType === 'sunday' && rates.sundayFreeParking && !isOvernight) {
      calculatedCost = 0;
      breakdownNotes.push('Covered by HDB Sunday Free Parking Scheme (7:00 AM – 10:30 PM).');
    } else {
      if (agency === 'HDB') {
        const halfHours = Math.ceil(totalDurationMinutes / 30);
        let standardHdbCost = halfHours * 0.60;
        
        if (isOvernight) {
          // Night parking cap applies
          standardHdbCost = Math.min(standardHdbCost, 5.00);
          breakdownNotes.push('HDB Night Parking Cap applied: Maximum $5.00 charge (10:30 PM – 7:00 AM).');
        } else {
          breakdownNotes.push(`${halfHours} x 30-minute blocks @ $0.60 per block.`);
        }
        calculatedCost = standardHdbCost;
      } else {
        // Commercial / Mall / URA calculation
        const chargeableHalfHours = Math.ceil(totalDurationMinutes / 30);
        const hourly = rates.estimatedHourlyPeak;
        calculatedCost = (chargeableHalfHours * (hourly / 2));

        if (dayType === 'weekday' && rates.weekdayDay.includes('1st hr')) {
          breakdownNotes.push(`Standard weekday tariff with progressive hourly breakdown.`);
        } else {
          breakdownNotes.push(`Estimated based on peak published rate: ~$${hourly.toFixed(2)}/hr.`);
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Singapore Parking Fee Calculator
              </h2>
              <p className="text-xs text-slate-400">
                Accurate fee estimation based on published HDB, URA &amp; Mall tariffs
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Select Carpark */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Select Carpark
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {carparks.map((cp) => (
                <option key={cp.id} value={cp.id} className="bg-slate-900 text-white">
                  [{cp.agency}] {cp.name} (${cp.rates.estimatedHourlyPeak.toFixed(2)}/hr)
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Day Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDayType('weekday')}
                className={`py-2 px-3 rounded-lg border font-medium transition-colors cursor-pointer text-center ${
                  dayType === 'weekday'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Weekday
              </button>
              <button
                type="button"
                onClick={() => setDayType('saturday')}
                className={`py-2 px-3 rounded-lg border font-medium transition-colors cursor-pointer text-center ${
                  dayType === 'saturday'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Saturday
              </button>
              <button
                type="button"
                onClick={() => setDayType('sunday')}
                className={`py-2 px-3 rounded-lg border font-medium transition-colors cursor-pointer text-center ${
                  dayType === 'sunday'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Sunday / PH
              </button>
            </div>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Hours Parked
              </label>
              <input
                type="number"
                min="0"
                max="48"
                value={hours}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Minutes Parked
              </label>
              <select
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={0}>0 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
              </select>
            </div>
          </div>

          {/* Overnight Toggle */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={isOvernight}
              onChange={(e) => setIsOvernight(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-slate-300">
              Includes Overnight Parking (10:30 PM to 7:00 AM)
            </span>
          </label>

          {/* Result Card */}
          {currentCarpark && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Estimated Fee</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                    ${calculatedCost.toFixed(2)} SGD
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span className="block font-mono">{hours}h {minutes}m duration</span>
                  <span className="text-slate-500">{currentCarpark.agency} Carpark</span>
                </div>
              </div>

              {/* Breakdown Notes */}
              <div className="pt-2 border-t border-emerald-500/20 space-y-1 text-[11px] text-slate-300">
                {breakdownNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded">
                <span className="font-semibold text-slate-300">Published Tariff: </span>
                {dayType === 'sunday' ? currentCarpark.rates.weekend : currentCarpark.rates.weekdayDay}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
