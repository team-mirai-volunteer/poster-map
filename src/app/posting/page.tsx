'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  saveShape as saveMapShape,
  deleteShape as deleteMapShape,
  loadShapes as loadMapShapes,
  MapShape as MapShapeData,
} from '@/lib/supabase';

const GeomanMap = dynamic(() => import('@/components/GeomanMap'), { ssr: false });

export default function PostingPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [shapeCount, setShapeCount] = useState(0);
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

      console.log('Geoman controls added successfully');

      // Event listeners for drawing - just update count
      mapInstance.on('pm:create', (e: any) => {
        console.log('Shape created:', e.layer);
        setTimeout(() => {
          updateShapeCount();
          if (autoSave) {
            saveCurrentMapState();
          }
        }, 100);
      });

      mapInstance.on('pm:remove', (e: any) => {
        console.log('Shape removed:', e.layer);
        setTimeout(() => {
          updateShapeCount();
          if (autoSave) {
            saveCurrentMapState();
          }
        }, 100);
      });

      mapInstance.on('pm:update', (e: any) => {
        console.log('Shape updated:', e.layer);
        setTimeout(() => {
          if (autoSave) {
            saveCurrentMapState();
          }
        }, 100);
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
        const savedShapes = await loadMapShapes();
        const L = (await import('leaflet')).default;
        
        savedShapes.forEach((shape: any) => {
          try {
            let layer;
            
            // Handle different geometry types properly
            if (shape.coordinates.type === 'Point' && shape.properties?.originalType === 'Circle') {
              // Restore circles from points
              const [lng, lat] = shape.coordinates.coordinates;
              const radius = shape.properties.radius || 100;
              layer = L.circle([lat, lng], { radius });
            } else {
              // Regular GeoJSON layer
              layer = L.geoJSON(shape.coordinates);
            }
            
            layer.addTo(mapInstance);
            
            console.log('Loaded shape:', shape.type);
          } catch (layerError) {
            console.error('Failed to create layer for shape:', shape, layerError);
          }
        });
        
        console.log('Loaded existing shapes:', savedShapes.length);
        updateShapeCount();
      } catch (error) {
        console.error('Failed to load existing shapes:', error);
      }
    };


    initializePostingMap();
  }, [mapInstance]);

  // Collect all drawn layers from the map
  const getAllDrawnLayers = () => {
    if (!mapInstance) return [];
    
    const L = (window as any).L;
    const allLayers: any[] = [];
    
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.Path || layer instanceof L.Marker) {
        // Skip base tiles and other non-drawn layers
        if (layer.pm && !layer._url) {
          allLayers.push(layer);
        }
      }
    });
    
    return allLayers;
  };

  // Update shape count
  const updateShapeCount = () => {
    const drawnLayers = getAllDrawnLayers();
    setShapeCount(drawnLayers.length);
    console.log('Shape count updated:', drawnLayers.length);
  };

  // Save current map state to database
  const saveCurrentMapState = async () => {
    if (!mapInstance) return;
    
    try {
      // Clear existing shapes from database first
      const existingShapes = await loadMapShapes();
      for (const shape of existingShapes) {
        await deleteMapShape(shape.id);
      }
      
      // Get all drawn layers and save them individually
      const L = (window as any).L;
      const drawnLayers: any[] = [];
      
      mapInstance.eachLayer((layer: any) => {
        if ((layer instanceof L.Path || layer instanceof L.Marker) && layer.pm && !layer._url) {
          drawnLayers.push(layer);
        }
      });
      
      if (drawnLayers.length === 0) {
        console.log('No shapes to save - clearing database');
        return;
      }
      
      // Save each layer individually to handle circles properly
      const savedShapes = [];
      for (const layer of drawnLayers) {
        let shape: MapShapeData;
        
        if (layer instanceof L.Circle) {
          // Handle circles specially since they become points in GeoJSON
          const center = layer.getLatLng();
          const radius = layer.getRadius();
          
          shape = {
            type: 'circle',
            coordinates: {
              type: 'Point',
              coordinates: [center.lng, center.lat]
            },
            properties: {
              radius: radius,
              originalType: 'Circle'
            }
          };
        } else {
          // Regular GeoJSON conversion
          const geoJSON = layer.toGeoJSON();
          shape = {
            type: geoJSON.geometry.type.toLowerCase() as MapShapeData['type'],
            coordinates: geoJSON.geometry,
            properties: {
              ...geoJSON.properties,
              originalType: geoJSON.geometry.type
            }
          };
        }
        
        const savedShape = await saveMapShape(shape);
        savedShapes.push(savedShape);
      }
      
      console.log(`Saved ${savedShapes.length} shapes to database`);
      
    } catch (error) {
      console.error('Failed to save map state:', error);
    }
  };

  // Manual save function
  const saveAllShapes = async () => {
    await saveCurrentMapState();
  };

  const clearAllShapes = () => {
    if (mapInstance) {
      const L = (window as any).L;
      mapInstance.eachLayer((layer: any) => {
        if ((layer instanceof L.Path || layer instanceof L.Marker) && layer.pm && !layer._url) {
          mapInstance.removeLayer(layer);
        }
      });
      setShapeCount(0);
      
      if (autoSave) {
        saveCurrentMapState(); // Clear database too
      }
    }
  };


  // Simple logic: if auto-save is off, all shapes are "unsaved" until manually saved
  const unsavedCount = autoSave ? 0 : shapeCount;

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
          Shapes: {shapeCount} {!autoSave && shapeCount > 0 ? '(need manual save)' : ''}
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
          disabled={autoSave || shapeCount === 0}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            backgroundColor: (!autoSave && shapeCount > 0) ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: (!autoSave && shapeCount > 0) ? 'pointer' : 'not-allowed'
          }}
        >
          Save All Shapes
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
