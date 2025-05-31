'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { saveMapShape, deleteMapShape, loadMapShapes, MapShapeData } from '@/lib/prisma';

const GeomanMap = dynamic(() => import('@/components/GeomanMap'), { ssr: false });

export default function PostingPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [shapeMap, setShapeMap] = useState<Map<any, string>>(new Map());


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
      mapInstance.on('pm:create', async (e: any) => {
        console.log('Shape created:', e.layer);
        
        try {
          const layer = e.layer;
          const geoJSON = layer.toGeoJSON();
          
          const shape: MapShapeData = {
            type: getShapeType(layer),
            coordinates: geoJSON.geometry,
            properties: geoJSON.properties || {}
          };
          
          const savedShape = await saveMapShape(shape);
          setShapeMap(prev => new Map(prev.set(layer, savedShape.id)));
          console.log('Shape saved to database:', savedShape);
        } catch (error) {
          console.error('Failed to save shape:', error);
        }
      });

      mapInstance.on('pm:remove', async (e: any) => {
        console.log('Shape removed:', e.layer);
        
        try {
          const layer = e.layer;
          const shapeId = shapeMap.get(layer);
          
          if (shapeId) {
            await deleteMapShape(shapeId);
            setShapeMap(prev => {
              const newMap = new Map(prev);
              newMap.delete(layer);
              return newMap;
            });
            console.log('Shape deleted from database');
          }
        } catch (error) {
          console.error('Failed to delete shape:', error);
        }
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

      // Load existing shapes from database
      loadExistingShapes();
    };

    const loadExistingShapes = async () => {
      try {
        const shapes = await loadMapShapes();
        const L = (await import('leaflet')).default;
        
        shapes.forEach((shape: any) => {
          const layer = L.geoJSON(shape.coordinates).addTo(mapInstance);
          setShapeMap(prev => new Map(prev.set(layer.getLayers()[0], shape.id)));
        });
        
        console.log('Loaded existing shapes:', shapes.length);
      } catch (error) {
        console.error('Failed to load existing shapes:', error);
      }
    };

    const getShapeType = (layer: any): MapShapeData['type'] => {
      if (layer instanceof (window as any).L.Marker) return 'marker';
      if (layer instanceof (window as any).L.Rectangle) return 'rectangle';
      if (layer instanceof (window as any).L.Polyline && !(layer instanceof (window as any).L.Polygon)) return 'polyline';
      if (layer instanceof (window as any).L.Polygon) return 'polygon';
      if (layer instanceof (window as any).L.Circle) return 'circle';
      return 'polygon';
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