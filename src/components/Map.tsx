'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  onMapReady?: (map: L.Map) => void;
  className?: string;
}

export default function Map({ onMapReady, className }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix Leaflet default markers in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current).setView([35.6762, 139.6503], 10);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (onMapReady) {
      onMapReady(map);
    }

    // Fix map sizing issues by forcing a resize after initial render
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onMapReady]);

  return (
    <div 
      ref={mapRef} 
      id="map" 
      className={className}
      style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
    />
  );
}