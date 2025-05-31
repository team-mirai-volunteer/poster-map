'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const GeomanMap = dynamic(() => import('@/components/GeomanMap'), { ssr: false });

export default function PostingPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);

  // Load existing lines from localStorage
  useEffect(() => {
    const savedLines = localStorage.getItem('posting-lines');
    if (savedLines) {
      setLines(JSON.parse(savedLines));
    }
  }, []);

  // Save lines to localStorage whenever lines change
  useEffect(() => {
    localStorage.setItem('posting-lines', JSON.stringify(lines));
  }, [lines]);

  // Initialize Geoman when map is ready
  useEffect(() => {
    if (!mapInstance) return;

    const initializePostingMap = async () => {
      const L = (await import('leaflet')).default;
      
      console.log('Map instance received, pm available:', !!mapInstance.pm);
      
      // Add base layer
      L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
      }).addTo(mapInstance);

      // Add Geoman controls
      mapInstance.pm.addControls({
        position: 'topleft',
        drawControls: true,
        editControls: true,
        optionsControls: true,
        customControls: false,
        oneBlock: false,
      });
      
      console.log('Geoman controls added successfully');

      // Load existing lines
      loadSavedLines();

      // Event listeners for drawing
      mapInstance.on('pm:create', (e: any) => {
        const layer = e.layer;
        if (layer.pm && layer.pm.getShape() === 'Line') {
          const coordinates = layer.getLatLngs().map((latlng: any) => [latlng.lat, latlng.lng]);
          const lineData = {
            id: Date.now(),
            coordinates,
            color: '#ff0000',
            timestamp: new Date().toISOString()
          };
          setLines(prev => [...prev, lineData]);
        }
      });

      mapInstance.on('pm:remove', (e: any) => {
        // Handle line deletion if needed
        loadSavedLines(); // Reload from state
      });
    };

    initializePostingMap();
  }, [mapInstance]);

  // Load saved lines into the map
  const loadSavedLines = async () => {
    if (!mapInstance) return;
    
    const L = (await import('leaflet')).default;
    
    // Clear existing custom lines (but keep geoman layers)
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline && !layer.pm) {
        mapInstance.removeLayer(layer);
      }
    });

    // Add saved lines
    lines.forEach(lineData => {
      const polyline = L.polyline(lineData.coordinates, {
        color: lineData.color || '#ff0000',
        weight: 3,
        opacity: 0.8
      }).addTo(mapInstance);
    });
  };

  // Load lines when lines state changes
  useEffect(() => {
    loadSavedLines();
  }, [lines, mapInstance]);


  const clearAllLines = () => {
    setLines([]);
    localStorage.removeItem('posting-lines');
    
    // Also clear any geoman layers
    if (mapInstance) {
      mapInstance.eachLayer((layer: any) => {
        if (layer.pm) {
          mapInstance.removeLayer(layer);
        }
      });
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/@geoman-io/leaflet-geoman-free@2.18.3/dist/leaflet-geoman.css" />
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }
        #map {
          width: 100%;
          height: 100vh;
          position: relative;
        }
        .clear-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .clear-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          background-color: #f8f9fa;
          color: #333;
          transition: background-color 0.2s;
        }
        .clear-button:hover {
          background-color: #e9ecef;
        }
        .clear-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Ensure Geoman toolbar is visible */
        .leaflet-pm-toolbar {
          z-index: 1000 !important;
        }
        
        .leaflet-pm-icon {
          background-color: white !important;
          border: 1px solid #ccc !important;
        }
      `}</style>
      
      <div className="clear-controls">
        <button 
          className="clear-button"
          onClick={clearAllLines}
          disabled={lines.length === 0}
        >
          Clear All ({lines.length})
        </button>
      </div>
      
      <GeomanMap onMapReady={setMapInstance} />
    </>
  );
}