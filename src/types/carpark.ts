export type AgencyType = 'HDB' | 'URA' | 'LTA' | 'Commercial' | 'Hospital';

export type VehicleFilter = 'all' | 'car' | 'motorcycle' | 'heavy' | 'ev';

export type District = 
  | 'Central / Downtown'
  | 'Orchard / River Valley'
  | 'Marina Bay'
  | 'East (Tampines / Bedok / Changi)'
  | 'West (Jurong / Clementi / Buona Vista)'
  | 'North (Woodlands / Yishun)'
  | 'North-East (Bishan / AMK / Sengkang)'
  | 'South (HarbourFront / Queenstown)';

export interface CarparkRates {
  weekdayDay: string;         // e.g. "$0.60 per 30 mins" or "$2.50/hr"
  weekdayNight: string;       // e.g. "$0.60 per 30 mins (Max $5.00)"
  weekend: string;            // e.g. "$0.60 per 30 mins"
  sundayFreeParking: boolean; // True for many HDB MSCP (7am - 10:30pm)
  gracePeriodMins: number;    // e.g. 10 or 15 mins
  estimatedHourlyPeak: number; // numeric for sorting / calculating ($)
  estimatedHourlyOffPeak: number;
}

export interface LotBreakdown {
  total: number;
  available: number;
}

export interface EVChargerInfo {
  count: number;
  available: number;
  fastCharging: boolean;
  provider: string; // e.g. "SP Mobility", "CDG ENGIE", "Shell Recharge"
}

export interface CarparkRecord {
  id: string;                      // Carpark code (e.g. "ACB", "TP12", "SUNTEC-W")
  name: string;                    // e.g. "Suntec City (West Wing)"
  agency: AgencyType;
  address: string;
  postalCode: string;
  district: District;
  coordinates: {
    lat: number;
    lng: number;
  };
  carparkType: 'Multi-Storey' | 'Surface' | 'Basement' | 'Mechanised';
  gantryClearanceHeight: number;  // in meters, e.g. 2.1
  rates: CarparkRates;
  lots: {
    car: LotBreakdown;
    motorcycle?: LotBreakdown;
    heavyVehicle?: LotBreakdown;
  };
  evChargers?: EVChargerInfo;
  electronicParkingSystem: boolean; // EPS
  shortTermParking: 'Whole Day' | '7am-10:30pm' | 'No';
  nightParking: boolean;
  lastUpdated: string;             // ISO or formatted
  occupancyTrend: number[];        // past 12 hours hourly occupancy % (e.g. [45, 52, 60, 85, 92, 88...])
  peakHourNotes?: string;
  isFavorite?: boolean;
  distanceKm?: number;             // calculated from user location
}

export interface FilterOptions {
  searchQuery: string;
  vehicleType: VehicleFilter;
  agency: 'all' | AgencyType;
  district: 'all' | District;
  minAvailableLots: number;
  minClearance: number;            // 0 = any, 2.0 = >= 2.0m, etc.
  freeSundayOnly: boolean;
  evOnly: boolean;
  sortBy: 'availability' | 'distance' | 'price' | 'name' | 'clearance';
  sortOrder: 'asc' | 'desc';
}

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
  isSimulated?: boolean;
}
