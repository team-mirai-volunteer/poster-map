'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { saveMapShape, deleteMapShape, loadMapShapes, MapShapeData } from '@/lib/prisma';

const GeomanMap = dynamic(() => import('@/components/GeomanMap'), { ssr: false });

export default function PostingPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [shapeMap, setShapeMap] = useState<Map<any, string>>(new Map());
  const [shapes, setShapes] = useState<any[]>([]);
  const [autoSave, setAutoSave] = useState(true);


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
        
        const layer = e.layer;
        const geoJSON = layer.toGeoJSON();
        
        const shape: MapShapeData = {
          type: getShapeType(layer),
          coordinates: geoJSON.geometry,
          properties: geoJSON.properties || {}
        };

        // Add to local state immediately
        setShapes(prev => [...prev, { layer, data: shape, saved: false }]);

        if (autoSave) {
          try {
            const savedShape = await saveMapShape(shape);
            setShapeMap(prev => new Map(prev.set(layer, savedShape.id)));
            setShapes(prev => prev.map(s => s.layer === layer ? { ...s, saved: true, id: savedShape.id } : s));
            console.log('Shape auto-saved to database:', savedShape);
          } catch (error) {
            console.error('Failed to auto-save shape:', error);
          }
        }
      });

      mapInstance.on('pm:remove', async (e: any) => {
        console.log('Shape removed:', e.layer);
        
        const layer = e.layer;
        
        // Remove from local state
        setShapes(prev => prev.filter(s => s.layer !== layer));
        
        if (autoSave) {
          try {
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

  // Manual save function
  const saveAllShapes = async () => {
    const unsavedShapes = shapes.filter(s => !s.saved);
    
    for (const shape of unsavedShapes) {
      try {
        const savedShape = await saveMapShape(shape.data);
        setShapeMap(prev => new Map(prev.set(shape.layer, savedShape.id)));
        setShapes(prev => prev.map(s => s.layer === shape.layer ? { ...s, saved: true, id: savedShape.id } : s));
        console.log('Shape manually saved:', savedShape);
      } catch (error) {
        console.error('Failed to manually save shape:', error);
      }
    }
  };

  const clearAllShapes = () => {
    if (mapInstance) {
      mapInstance.eachLayer((layer: any) => {
        if (layer.pm) {
          mapInstance.removeLayer(layer);
        }
      });
      setShapes([]);
      setShapeMap(new Map());
    }
  };


  const unsavedCount = shapes.filter(s => !s.saved).length;

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/@geoman-io/leaflet-geoman-free@2.18.3/dist/leaflet-geoman.css" />
      
      {/* Control Panel */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Shapes: {shapes.length} | Unsaved: {unsavedCount}
        </div>
        
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          Auto-save
        </label>
        
        <button
          onClick={saveAllShapes}
          disabled={unsavedCount === 0}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            backgroundColor: unsavedCount > 0 ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: unsavedCount > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Save All ({unsavedCount})
        </button>
        
        <button
          onClick={clearAllShapes}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
      </div>

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