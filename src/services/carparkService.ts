import { CarparkRecord, UserLocation } from '../types/carpark';
import { INITIAL_SINGAPORE_CARPARKS } from '../data/singaporeCarparks';

const FAVORITES_STORAGE_KEY = 'parksg_favorites_v1';
const API_CONFIG_STORAGE_KEY = 'parksg_api_config_v1';

export interface ApiConfig {
  useCustomBackend: boolean;
  customBackendUrl: string; // e.g. "http://localhost:3000/api/carparks" or "/api/carparks"
  apiKey?: string;
  autoRefreshIntervalSecs: number; // e.g. 30
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  useCustomBackend: false,
  customBackendUrl: '/api/carparkavailability',
  apiKey: '',
  autoRefreshIntervalSecs: 30,
};

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class CarparkService {
  private static favorites: Set<string> = new Set();
  private static memoryCarparks: CarparkRecord[] = [...INITIAL_SINGAPORE_CARPARKS];

  // Initialize stored favorites
  public static initFavorites(): Set<string> {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.favorites = new Set(parsed);
        }
      }
    } catch {
      // Fallback to empty if localStorage is disabled
    }
    return this.favorites;
  }

  public static isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  public static toggleFavorite(id: string): boolean {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(Array.from(this.favorites))
      );
    } catch {
      // Ignore storage errors
    }
    return this.favorites.has(id);
  }

  public static getApiConfig(): ApiConfig {
    try {
      const stored = localStorage.getItem(API_CONFIG_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_API_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_API_CONFIG;
  }

  public static saveApiConfig(config: ApiConfig): void {
    try {
      localStorage.setItem(API_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore
    }
  }

  /**
   * Fetch carparks. If custom backend is active, attempts real fetch.
   * If in mock mode, returns local dataset with realistic lot fluctuations.
   */
  public static async fetchCarparks(userLoc?: UserLocation): Promise<{
    carparks: CarparkRecord[];
    isFromLiveBackend: boolean;
    error?: string;
  }> {
    const config = this.getApiConfig();

    if (config.useCustomBackend && config.customBackendUrl) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (config.apiKey) {
          headers['AccountKey'] = config.apiKey;
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const res = await fetch(config.customBackendUrl, { headers });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        
        // Handle raw or normalized LTA items
        const rawList = Array.isArray(data) ? data : data.items || data.value || [];
        if (rawList.length > 0) {
          const processed: CarparkRecord[] = rawList.map((item: any, index: number) => {
            // Check if already in CarparkRecord format
            if (item.lots && item.coordinates) {
              const distance = userLoc
                ? calculateDistanceKm(userLoc.lat, userLoc.lng, item.coordinates.lat, item.coordinates.lng)
                : undefined;
              return {
                ...item,
                isFavorite: this.favorites.has(item.id),
                distanceKm: distance,
              };
            }

            // Otherwise map from LTA DataMall structure
            let lat = 1.3521;
            let lng = 103.8198;
            if (item.Location && typeof item.Location === 'string') {
              const parts = item.Location.trim().split(/\s+/);
              if (parts.length >= 2) {
                lat = parseFloat(parts[0]) || lat;
                lng = parseFloat(parts[1]) || lng;
              }
            } else if (item.coordinates) {
              lat = item.coordinates.lat;
              lng = item.coordinates.lng;
            }

            const availLots = Number(item.AvailableLots) || Number(item.availableLots) || 0;
            const totalEst = Math.max(availLots + 50, 200);

            const record: CarparkRecord = {
              id: String(item.CarParkID || item.id || `LTA-${index + 1}`),
              name: item.Development || item.name || `Carpark ${item.CarParkID}`,
              agency: (item.Agency || item.agency || 'LTA') as any,
              address: item.Area ? `${item.Area}, Singapore` : 'Singapore',
              postalCode: 'Singapore',
              district: (item.Area?.includes('Marina') ? 'Marina Bay' : 'Central / Downtown') as any,
              coordinates: { lat, lng },
              carparkType: 'Multi-Storey',
              gantryClearanceHeight: 2.1,
              rates: {
                weekdayDay: '$1.40 per 30 mins',
                weekdayNight: '$0.70 per 30 mins (Cap $5.00)',
                weekend: '$1.40 per 30 mins',
                sundayFreeParking: item.Agency === 'HDB',
                gracePeriodMins: 10,
                estimatedHourlyPeak: 2.80,
                estimatedHourlyOffPeak: 1.40,
              },
              lots: {
                car: { total: totalEst, available: availLots },
              },
              electronicParkingSystem: true,
              shortTermParking: 'Whole Day',
              nightParking: true,
              lastUpdated: item.lastUpdated || new Date().toISOString(),
              occupancyTrend: [45, 55, 70, 85, 90, 88, 80, 75, 60, 50, 40, 30],
              isFavorite: this.favorites.has(String(item.CarParkID || item.id)),
              distanceKm: userLoc ? calculateDistanceKm(userLoc.lat, userLoc.lng, lat, lng) : undefined,
            };
            return record;
          });

          return { carparks: processed, isFromLiveBackend: true };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown backend connection error';
        console.warn('Backend fetch failed, falling back to local simulation:', errorMsg);
        // Fallback to simulated data with an error notice
        return {
          carparks: this.getSimulatedCarparks(userLoc),
          isFromLiveBackend: false,
          error: `Could not reach ${config.customBackendUrl} (${errorMsg}). Showing local data.`,
        };
      }
    }

    return {
      carparks: this.getSimulatedCarparks(userLoc),
      isFromLiveBackend: false,
    };
  }

  /**
   * Applies subtle realistic variance (+/- 1-3 cars) to mimic cars entering/leaving
   */
  public static simulateLotFluctuations(): void {
    this.memoryCarparks = this.memoryCarparks.map((cp) => {
      // 50% chance of a minor delta
      if (Math.random() > 0.4) {
        const carDelta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newCarAvail = Math.max(0, Math.min(cp.lots.car.total, cp.lots.car.available + carDelta));
        
        let newMotoAvail = cp.lots.motorcycle?.available ?? 0;
        if (cp.lots.motorcycle && Math.random() > 0.6) {
          const motoDelta = Math.floor(Math.random() * 3) - 1; // -1 to +1
          newMotoAvail = Math.max(0, Math.min(cp.lots.motorcycle.total, newMotoAvail + motoDelta));
        }

        return {
          ...cp,
          lastUpdated: new Date().toISOString(),
          lots: {
            ...cp.lots,
            car: {
              ...cp.lots.car,
              available: newCarAvail,
            },
            motorcycle: cp.lots.motorcycle
              ? { ...cp.lots.motorcycle, available: newMotoAvail }
              : undefined,
          },
        };
      }
      return cp;
    });
  }

  private static getSimulatedCarparks(userLoc?: UserLocation): CarparkRecord[] {
    return this.memoryCarparks.map((cp) => {
      const distance = userLoc
        ? calculateDistanceKm(userLoc.lat, userLoc.lng, cp.coordinates.lat, cp.coordinates.lng)
        : undefined;

      return {
        ...cp,
        isFavorite: this.favorites.has(cp.id),
        distanceKm: distance,
      };
    });
  }
}
