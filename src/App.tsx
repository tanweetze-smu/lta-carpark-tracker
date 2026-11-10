import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CarparkRecord, FilterOptions, UserLocation, District, AgencyType, VehicleFilter 
} from './types/carpark';
import { CarparkService, DEFAULT_API_CONFIG } from './services/carparkService';
import { POPULAR_LOCATIONS } from './data/singaporeCarparks';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { CarparkCard } from './components/CarparkCard';
import { CarparkTable } from './components/CarparkTable';
import { CarparkMap } from './components/CarparkMap';
import { CarparkDetail } from './components/CarparkDetail';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { RateCalculatorModal } from './components/RateCalculatorModal';
import { Bookmark, Sparkles, Navigation, AlertCircle, RefreshCw, Car } from 'lucide-react';

const DEFAULT_USER_LOCATION: UserLocation = {
  lat: 1.2847,
  lng: 103.8504,
  label: 'Marina Bay / CBD',
};

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  vehicleType: 'all',
  agency: 'all',
  district: 'all',
  minAvailableLots: 0,
  minClearance: 0,
  freeSundayOnly: false,
  evOnly: false,
  sortBy: 'availability',
  sortOrder: 'desc',
};

export default function App() {
  const [carparks, setCarparks] = useState<CarparkRecord[]>([]);
  const [selectedCarpark, setSelectedCarpark] = useState<CarparkRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'explore' | 'saved' | 'calculator'>('explore');
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_USER_LOCATION);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFromLiveBackend, setIsFromLiveBackend] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [isRateCalcModalOpen, setIsRateCalcModalOpen] = useState<boolean>(false);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [countdownSecs, setCountdownSecs] = useState<number>(30);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load favorites & initial data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await CarparkService.fetchCarparks(userLocation);
      setCarparks(res.carparks);
      setIsFromLiveBackend(res.isFromLiveBackend);
      setBackendError(res.error || null);
      setLastUpdated(new Date());

      const favSet = CarparkService.initFavorites();
      setFavoritesCount(favSet.size);

      // Keep selected carpark synced with new lot counts if opened
      if (selectedCarpark) {
        const updated = res.carparks.find((c) => c.id === selectedCarpark.id);
        if (updated) setSelectedCarpark(updated);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [userLocation, selectedCarpark]);

  useEffect(() => {
    CarparkService.initFavorites();
    loadData();
  }, []);

  // Auto-refresh countdown and realistic lot drift
  useEffect(() => {
    const config = CarparkService.getApiConfig();
    const refreshInterval = config.autoRefreshIntervalSecs || 30;
    setCountdownSecs(refreshInterval);

    const timer = setInterval(() => {
      setCountdownSecs((prev) => {
        if (prev <= 1) {
          // Trigger subtle lot fluctuations simulation or backend fetch
          CarparkService.simulateLotFluctuations();
          loadData();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadData]);

  // Toggle favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    CarparkService.toggleFavorite(id);
    const favSet = CarparkService.initFavorites();
    setFavoritesCount(favSet.size);

    setCarparks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: favSet.has(id) } : c))
    );

    if (selectedCarpark && selectedCarpark.id === id) {
      setSelectedCarpark((prev) => (prev ? { ...prev, isFavorite: favSet.has(id) } : null));
    }
  };

  // Browser Geolocation
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Current GPS Location',
        };
        setUserLocation(newLoc);
        setIsDetectingLocation(false);
        // Refresh distance calculations
        setTimeout(() => loadData(), 50);
      },
      (err) => {
        console.warn('Geolocation failed or permission denied:', err.message);
        setIsDetectingLocation(false);
        // Fallback to Orchard Road
        setUserLocation({
          lat: 1.3040,
          lng: 103.8318,
          label: 'Orchard Road (Simulated GPS)',
          isSimulated: true,
        });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Select predefined reference location
  const handleSelectLocation = (loc: { label: string; lat: number; lng: number }) => {
    setUserLocation({
      lat: loc.lat,
      lng: loc.lng,
      label: loc.label,
    });
    setTimeout(() => loadData(), 50);
  };

  // Filtered & Sorted Carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Tab filter
        if (activeTab === 'saved' && !cp.isFavorite) {
          return false;
        }

        // Search query
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchPostal = cp.postalCode.includes(q);
          const matchId = cp.id.toLowerCase().includes(q);
          const matchDistrict = cp.district.toLowerCase().includes(q);
          if (!matchName && !matchAddress && !matchPostal && !matchId && !matchDistrict) {
            return false;
          }
        }

        // Vehicle Filter
        if (filters.vehicleType === 'car') {
          if (cp.lots.car.total === 0) return false;
        } else if (filters.vehicleType === 'motorcycle') {
          if (!cp.lots.motorcycle || cp.lots.motorcycle.total === 0) return false;
        } else if (filters.vehicleType === 'heavy') {
          if (!cp.lots.heavyVehicle || cp.lots.heavyVehicle.total === 0) return false;
        } else if (filters.vehicleType === 'ev') {
          if (!cp.evChargers || cp.evChargers.count === 0) return false;
        }

        // Agency Filter
        if (filters.agency !== 'all' && cp.agency !== filters.agency) {
          return false;
        }

        // District Filter
        if (filters.district !== 'all' && cp.district !== filters.district) {
          return false;
        }

        // Sunday Free Parking
        if (filters.freeSundayOnly && !cp.rates.sundayFreeParking) {
          return false;
        }

        // Clearance Height
        if (filters.minClearance > 0 && cp.gantryClearanceHeight < filters.minClearance) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'availability') {
          return b.lots.car.available - a.lots.car.available;
        }
        if (filters.sortBy === 'distance') {
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        }
        if (filters.sortBy === 'price') {
          return a.rates.estimatedHourlyPeak - b.rates.estimatedHourlyPeak;
        }
        if (filters.sortBy === 'clearance') {
          return b.gantryClearanceHeight - a.gantryClearanceHeight;
        }
        return a.name.localeCompare(b.name);
      });
  }, [carparks, filters, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favoritesCount}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onRefreshLots={loadData}
        isRefreshing={isRefreshing}
        isFromLiveBackend={isFromLiveBackend}
      />

      {/* Backend connection banner if custom backend failed or is connected */}
      {backendError && (
        <div className="bg-amber-950/40 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{backendError}</span>
          </div>
          <button
            onClick={() => setIsBackendModalOpen(true)}
            className="text-amber-200 underline font-semibold hover:text-white shrink-0 cursor-pointer"
          >
            Configure Endpoint
          </button>
        </div>
      )}

      {/* Islandwide Stats Bar */}
      <StatsBar
        carparks={carparks}
        lastUpdated={lastUpdated}
        countdownSecs={countdownSecs}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        selectedLocationLabel={userLocation.label}
      />

      {/* Filter and Control Bar (Only shown on explore and saved tabs) */}
      {activeTab !== 'calculator' && (
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onSelectLocation={handleSelectLocation}
          onDetectCurrentLocation={handleDetectCurrentLocation}
          isDetectingLocation={isDetectingLocation}
          selectedLocationLabel={userLocation.label}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* TAB 1 & 2: EXPLORE & SAVED CARPARKS */}
        {activeTab !== 'calculator' && (
          <div>
            {/* View Mode: SPLIT VIEW (List on left, Leaflet Map on right) */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Carpark Cards List */}
                <div className="lg:col-span-5 space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      Showing <strong className="text-white font-mono">{filteredCarparks.length}</strong> {activeTab === 'saved' ? 'saved' : ''} carparks
                    </span>
                    {activeTab === 'saved' && (
                      <span className="text-amber-400 font-medium">Bookmarks view</span>
                    )}
                  </div>

                  {filteredCarparks.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        {activeTab === 'saved' ? <Bookmark className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                      </div>
                      <h3 className="font-semibold text-white text-sm">
                        {activeTab === 'saved' ? 'No Saved Carparks Yet' : 'No Carparks Found'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {activeTab === 'saved'
                          ? 'Click the bookmark icon on any carpark card to save it for rapid daily lot tracking.'
                          : 'Try clearing your search query or loosening the filters.'}
                      </p>
                      {activeTab === 'saved' ? (
                        <button
                          onClick={() => setActiveTab('explore')}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Explore All Carparks
                        </button>
                      ) : (
                        <button
                          onClick={() => setFilters(DEFAULT_FILTERS)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
                      {filteredCarparks.map((cp) => (
                        <CarparkCard
                          key={cp.id}
                          carpark={cp}
                          isSelected={selectedCarpark?.id === cp.id}
                          onSelect={() => setSelectedCarpark(cp)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Sticky Leaflet Map */}
                <div className="lg:col-span-7 sticky top-20">
                  <CarparkMap
                    carparks={filteredCarparks}
                    selectedCarpark={selectedCarpark}
                    onSelectCarpark={setSelectedCarpark}
                    userLocation={userLocation}
                    heightClass="h-[calc(100vh-230px)] min-h-[520px]"
                  />
                </div>
              </div>
            )}

            {/* View Mode: FULL MAP */}
            {viewMode === 'map' && (
              <div className="relative">
                <CarparkMap
                  carparks={filteredCarparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={setSelectedCarpark}
                  userLocation={userLocation}
                  heightClass="h-[calc(100vh-230px)] min-h-[600px]"
                />

                {/* Floating summary tray */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl max-w-sm hidden sm:block">
                  <span className="text-xs font-semibold text-white block mb-1">
                    {filteredCarparks.length} Singapore Carparks Mapped
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Click any marker on the map to inspect live lot counts, published hourly tariffs, gantry clearance, and turn-by-turn navigation.
                  </p>
                </div>
              </div>
            )}

            {/* View Mode: CARDS & TABLE VIEW */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                <CarparkTable
                  carparks={filteredCarparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={setSelectedCarpark}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STANDALONE RATE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="max-w-2xl mx-auto py-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Singapore Parking Fee Estimator
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select any carpark across Singapore to calculate estimated parking charges based on daytime, night cap, grace period, and Sunday free parking rules.
              </p>
            </div>

            <RateCalculatorModal
              isOpen={true}
              onClose={() => setActiveTab('explore')}
              carparks={carparks}
            />
          </div>
        )}
      </main>

      {/* Slide-out Carpark Inspector Drawer */}
      <CarparkDetail
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Developer Backend Connection Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onConfigSaved={loadData}
      />
    </div>
  );
}
