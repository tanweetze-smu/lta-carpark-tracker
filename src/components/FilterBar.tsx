import React from 'react';
import { FilterOptions, AgencyType, District, VehicleFilter } from '../types/carpark';
import { POPULAR_LOCATIONS } from '../data/singaporeCarparks';
import { Search, X, MapPin, Navigation, Sliders, ArrowUpDown, ShieldCheck } from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  viewMode: 'split' | 'map' | 'list';
  setViewMode: (mode: 'split' | 'map' | 'list') => void;
  onSelectLocation: (loc: { label: string; lat: number; lng: number }) => void;
  onDetectCurrentLocation: () => void;
  isDetectingLocation: boolean;
  selectedLocationLabel: string;
}

const VEHICLE_TABS: { id: VehicleFilter; label: string }[] = [
  { id: 'all', label: 'All Vehicles' },
  { id: 'car', label: 'Cars Only' },
  { id: 'motorcycle', label: 'Motorcycles' },
  { id: 'heavy', label: 'Heavy Vehicles' },
  { id: 'ev', label: 'EV Charging' },
];

const AGENCIES: ('all' | AgencyType)[] = ['all', 'HDB', 'URA', 'LTA', 'Commercial', 'Hospital'];

const DISTRICTS: ('all' | District)[] = [
  'all',
  'Central / Downtown',
  'Orchard / River Valley',
  'Marina Bay',
  'East (Tampines / Bedok / Changi)',
  'West (Jurong / Clementi / Buona Vista)',
  'North (Woodlands / Yishun)',
  'North-East (Bishan / AMK / Sengkang)',
  'South (HarbourFront / Queenstown)',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  onSelectLocation,
  onDetectCurrentLocation,
  isDetectingLocation,
  selectedLocationLabel,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 space-y-3.5">
      {/* Row 1: Search & Reference Location & View Mode */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search by carpark name, address, 6-digit postal code (e.g. 038983), or code..."
            className="w-full pl-10 pr-9 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location Selector (GPS or Singapore Hubs) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={onDetectCurrentLocation}
              disabled={isDetectingLocation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-emerald-400 hover:bg-slate-700/80 transition-colors cursor-pointer"
              title="Use Device GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">GPS</span>
            </button>
            <span className="w-px h-4 bg-slate-700 mx-1" />
            <select
              value={selectedLocationLabel}
              onChange={(e) => {
                const found = POPULAR_LOCATIONS.find((l) => l.label === e.target.value);
                if (found) onSelectLocation(found);
              }}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none px-2 py-1 cursor-pointer"
            >
              <option value="Singapore Centre (Marina Bay)" className="bg-slate-800 text-white">
                Near: Marina Bay / CBD
              </option>
              {POPULAR_LOCATIONS.map((loc) => (
                <option key={loc.label} value={loc.label} className="bg-slate-800 text-white">
                  Near: {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Segmented Controls */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'split' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards / Table
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'map' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Map
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Vehicle Segmented Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-y-2.5 gap-x-4 text-xs">
        {/* Vehicle Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/70 overflow-x-auto max-w-full">
          {VEHICLE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilters((prev) => ({ ...prev, vehicleType: tab.id }))}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filters.vehicleType === tab.id
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Agency Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Agency */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <span className="text-slate-400">Agency:</span>
            <select
              value={filters.agency}
              onChange={(e) => setFilters((prev) => ({ ...prev, agency: e.target.value as any }))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {AGENCIES.map((ag) => (
                <option key={ag} value={ag} className="bg-slate-800 text-white">
                  {ag === 'all' ? 'All Agencies' : ag}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <span className="text-slate-400">Region:</span>
            <select
              value={filters.district}
              onChange={(e) => setFilters((prev) => ({ ...prev, district: e.target.value as any }))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              {DISTRICTS.map((dist) => (
                <option key={dist} value={dist} className="bg-slate-800 text-white">
                  {dist === 'all' ? 'All Singapore' : dist}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="availability" className="bg-slate-800 text-white">
                Most Lots Available
              </option>
              <option value="distance" className="bg-slate-800 text-white">
                Nearest to Reference
              </option>
              <option value="price" className="bg-slate-800 text-white">
                Lowest Hourly Rate
              </option>
              <option value="clearance" className="bg-slate-800 text-white">
                Tallest Clearance
              </option>
            </select>
          </div>

          {/* Special Toggle: Sunday Free Parking */}
          <button
            onClick={() => setFilters((prev) => ({ ...prev, freeSundayOnly: !prev.freeSundayOnly }))}
            className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filters.freeSundayOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            Sunday Free Parking
          </button>

          {/* Special Toggle: Clearance >= 2.0m */}
          <button
            onClick={() => setFilters((prev) => ({ ...prev, minClearance: prev.minClearance > 0 ? 0 : 2.1 }))}
            className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filters.minClearance > 0
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            Min 2.1m Height
          </button>
        </div>
      </div>
    </div>
  );
};
