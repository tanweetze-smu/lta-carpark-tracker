import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CarparkRecord, UserLocation } from '../types/carpark';

interface CarparkMapProps {
  carparks: CarparkRecord[];
  selectedCarpark: CarparkRecord | null;
  onSelectCarpark: (carpark: CarparkRecord) => void;
  userLocation: UserLocation;
  heightClass?: string;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
  heightClass = 'h-[calc(100vh-210px)] min-h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [1.3521, 103.8198], // Singapore center
        zoom: 12,
        zoomControl: false,
      });

      // CartoDB Dark Matter or OpenStreetMap tile layer (reliable, high contrast dark mode)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update User Reference Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindTooltip(`Reference: ${userLocation.label}`, {
        permanent: false,
        direction: 'top',
        className: 'bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-md border border-slate-700',
      })
      .addTo(map);

    userMarkerRef.current = marker;
  }, [userLocation]);

  // Update Carpark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    carparks.forEach((cp) => {
      const avail = cp.lots.car.available;
      const isSelected = selectedCarpark?.id === cp.id;

      // Color based on availability
      let badgeBg = 'bg-emerald-600 text-white';
      let borderCol = 'border-emerald-400';
      if (avail === 0) {
        badgeBg = 'bg-rose-600 text-white';
        borderCol = 'border-rose-400';
      } else if (avail < 30) {
        badgeBg = 'bg-amber-500 text-slate-950 font-bold';
        borderCol = 'border-amber-300';
      }

      const ringClass = isSelected
        ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-110 z-50'
        : 'hover:scale-110 transition-transform';

      const customHtml = `
        <div class="cursor-pointer ${ringClass}">
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-full ${badgeBg} border ${borderCol} shadow-lg text-[11px] font-mono tabular-nums font-semibold whitespace-nowrap">
            <span>${avail === 0 ? 'FULL' : avail}</span>
            <span class="text-[9px] opacity-80 uppercase">${cp.agency}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-carpark-marker',
        html: customHtml,
        iconSize: [48, 22],
        iconAnchor: [24, 11],
      });

      const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], { icon });

      // Rich popup
      const popupHtml = `
        <div class="p-3 w-64 bg-slate-900 text-slate-100 rounded-lg text-xs space-y-2">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="font-semibold text-white text-sm line-clamp-1">${cp.name}</div>
              <div class="text-[11px] text-slate-400">${cp.agency} · ${cp.carparkType}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-center py-1 bg-slate-800/60 rounded p-1.5 font-mono">
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Available</div>
              <div class="text-base font-bold ${avail > 0 ? 'text-emerald-400' : 'text-rose-400'}">${avail}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Total Lots</div>
              <div class="text-base font-bold text-slate-300">${cp.lots.car.total}</div>
            </div>
          </div>

          <div class="text-[11px] text-slate-300">
            <span class="text-slate-400">Peak Rate: </span>
            <span>$${cp.rates.estimatedHourlyPeak.toFixed(2)}/hr</span>
          </div>

          <div class="pt-1 flex gap-2">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${cp.coordinates.lat},${cp.coordinates.lng}" 
              target="_blank" 
              rel="noreferrer"
              class="flex-1 text-center py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] transition-colors"
            >
              Directions
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      marker.addTo(markersLayer);
    });
  }, [carparks, selectedCarpark, onSelectCarpark]);

  // Center on selected carpark
  useEffect(() => {
    if (selectedCarpark && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
        15,
        { duration: 0.8 }
      );
    }
  }, [selectedCarpark]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 shadow-lg pointer-events-auto flex flex-col gap-1.5">
        <div className="font-semibold text-slate-200 text-xs border-b border-slate-800 pb-1">
          Lot Status
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>&gt; 30 Lots (Available)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>1–29 Lots (Limited)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>0 Lots (Full)</span>
        </div>
      </div>
    </div>
  );
};
