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
  customBackendUrl: '/api/carparks',
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
          headers['Authorization'] = `Bearer ${config.apiKey}`;
          headers['AccountKey'] = config.apiKey; // Common for LTA DataMall
        }

        const res = await fetch(config.customBackendUrl, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        
        // Standardize whatever backend returned or merge
        const parsedCarparks = Array.isArray(data) ? data : data.items || data.value || [];
        if (parsedCarparks.length > 0) {
          const processed = parsedCarparks.map((cp: CarparkRecord) => {
            const distance = userLoc
              ? calculateDistanceKm(userLoc.lat, userLoc.lng, cp.coordinates.lat, cp.coordinates.lng)
              : undefined;
            return {
              ...cp,
              isFavorite: this.favorites.has(cp.id),
              distanceKm: distance,
            };
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
