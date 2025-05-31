'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const GeomanMap = dynamic(() => import('@/components/GeomanMap'), { ssr: false });

export default function PostingPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);


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
        drawMarker: true,
        drawRectangle: true,
        drawPolyline: true,
        drawPolygon: true,
        drawCircle: true,
        editMode: true,
        dragMode: true,
        cutPolygon: true,
        removalMode: true,
      });

      // Enable undo/redo functionality
      mapInstance.pm.Toolbar.setButtonDisabled('undo', false);
      mapInstance.pm.Toolbar.setButtonDisabled('redo', false);
      
      console.log('Geoman controls added successfully');

      // Event listeners for drawing
      mapInstance.on('pm:create', (e: any) => {
        console.log('Shape created:', e.layer);
        // TODO: Save to database
      });

      mapInstance.on('pm:remove', (e: any) => {
        console.log('Shape removed:', e.layer);
        // TODO: Remove from database
      });

      // Event listeners for edit operations
      mapInstance.on('pm:cut', (e: any) => {
        console.log('Shape cut:', e);
      });

      mapInstance.on('pm:undo', (e: any) => {
        console.log('Undo action:', e);
      });

      mapInstance.on('pm:redo', (e: any) => {
        console.log('Redo action:', e);
      });

      // Enable undo/redo history tracking
      mapInstance.pm.setPathOptions({
        snappable: true,
        snapDistance: 20,
      });
    };

    initializePostingMap();
  }, [mapInstance]);


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
        /* Ensure Geoman toolbar is visible */
        .leaflet-pm-toolbar {
          z-index: 1000 !important;
        }
        
        .leaflet-pm-icon {
          background-color: white !important;
          border: 1px solid #ccc !important;
        }
      `}</style>
      
      <GeomanMap onMapReady={setMapInstance} />
    </>
  );
}