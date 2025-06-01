'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  saveShape as saveMapShape,
  deleteShape as deleteMapShape,
  loadShapes as loadMapShapes,
  updateShape as updateMapShape,
  MapShape as MapShapeData,
} from '@/lib/supabase';

const GeomanMap = dynamic(() => import('@/components/GeomanMap'), { ssr: false });

export default function PostingPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [shapeCount, setShapeCount] = useState(0);
  const autoSave = true;


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
      mapInstance.on('pm:create', async (e: any) => {
        console.log('Shape created:', e.layer);
        if (e.layer) {
          await saveOrUpdateLayer(e.layer);
          attachTextEvents(e.layer);
          updateShapeCount();
        }
      });

      mapInstance.on('pm:remove', async (e: any) => {
        console.log('Shape removed:', e.layer);
        const layer = e.layer;
        const sid = getShapeId(layer);
        if (sid) {
          await deleteMapShape(sid);
        }
        updateShapeCount();
      });

      mapInstance.on('pm:update', async (e: any) => {
        console.log('Shape updated:', e.layer);
        await saveOrUpdateLayer(e.layer);
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
            if (shape.type === 'text' || shape.properties?.originalType === 'Text') {
              const [lng, lat] = shape.coordinates.coordinates;
              const text = shape.properties?.text || '';
              layer = L.marker([lat, lng], {
                textMarker: true,
                text,
              });
              (layer as any)._shapeId = shape.id; // preserve id
              attachTextEvents(layer);
            } else if (shape.coordinates.type === 'Point' && shape.properties?.originalType === 'Circle') {
              // Restore circles from points
              const [lng, lat] = shape.coordinates.coordinates;
              const radius = shape.properties.radius || 100;
              layer = L.circle([lat, lng], { radius });
              (layer as any)._shapeId = shape.id; // preserve id
              attachTextEvents(layer);
            } else {
              // Regular GeoJSON layer
              layer = L.geoJSON(shape.coordinates);
              (layer as any)._shapeId = shape.id; // preserve id
              attachTextEvents(layer);
            }
            
            layer.addTo(mapInstance);
            
            // store id on all sub layers for robust update/delete
            propagateShapeId(layer, shape.id);

            if (shape.type === 'text' || shape.properties?.originalType === 'Text') {
              attachTextEvents(layer);
            }
            
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
        
        const shapeName = layer.pm?.getShape ? layer.pm.getShape() : undefined;

        if (shapeName === 'Text') {
          // Official Geoman text layer
          const center = layer.getLatLng();
          const textContent = layer.pm?.getText ? layer.pm.getText() : '';

          shape = {
            type: 'text',
            coordinates: {
              type: 'Point',
              coordinates: [center.lng, center.lat],
            },
            properties: {
              text: textContent,
              originalType: 'Text',
            },
          };
        } else if (layer instanceof L.Circle) {
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
    const layers = getAllDrawnLayers();
    for (const l of layers) {
      await saveOrUpdateLayer(l);
    }
    console.log('Manual save complete');
  };

  // Simple logic: if auto-save is off, all shapes are "unsaved" until manually saved
  const unsavedCount = autoSave ? 0 : shapeCount;

  // Minimal custom style example (optional)
  const textMarkerStyles = `
    .pm-text {
      font-size:14px;
      color:#000;
    }
  `;

  // Helper to bind text events on individual text layers
  function attachTextEvents(layer: any) {
    if (!layer || !layer.pm) return;

    // Remove previous listeners (if any) to avoid duplication
    layer.off('pm:textchange');
    layer.off('pm:textblur');

    // Mark layer as dirty whenever content actually changes
    layer.on('pm:textchange', () => {
      (layer as any)._textDirty = true;
    });

    layer.on('pm:textblur', () => {
      if ((layer as any)._textDirty) {
        console.log('Text layer changed -> saving');
        (layer as any)._textDirty = false;
        if (autoSave) saveOrUpdateLayer(layer);
      }
    });
  }

  // Extract MapShapeData from a given leaflet layer
  const extractShapeData = (layer: any): MapShapeData => {
    const L = (window as any).L;
    if (!L) throw new Error('Leaflet not loaded');

    const shapeName = layer.pm?.getShape ? layer.pm.getShape() : undefined;

    if (shapeName === 'Text') {
      const center = layer.getLatLng();
      const textContent = layer.pm?.getText ? layer.pm.getText() : '';
      return {
        type: 'text',
        coordinates: {
          type: 'Point',
          coordinates: [center.lng, center.lat],
        },
        properties: { text: textContent, originalType: 'Text' },
      };
    }

    if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      return {
        type: 'circle',
        coordinates: { type: 'Point', coordinates: [center.lng, center.lat] },
        properties: { radius, originalType: 'Circle' },
      };
    }

    const geoJSON = layer.toGeoJSON();
    return {
      type: geoJSON.geometry.type.toLowerCase() as MapShapeData['type'],
      coordinates: geoJSON.geometry,
      properties: { ...geoJSON.properties, originalType: geoJSON.geometry.type },
    };
  };

  // Save or update layer depending on presence of _shapeId
  const saveOrUpdateLayer = async (layer: any) => {
    const shapeData = extractShapeData(layer);
    const sid = getShapeId(layer);
    if (sid) {
      await updateMapShape(sid, {
        coordinates: shapeData.coordinates,
        properties: shapeData.properties,
      });
    } else {
      const saved = await saveMapShape(shapeData);
      propagateShapeId(layer, saved.id);
      return saved;
    }
  };

  // Helper when building shape in bulk saveCurrentMapState (legacy path)
  const saveOrUpdateShapeRecord = async (layer: any, shape: MapShapeData) => {
    const sid = getShapeId(layer);
    if (sid) {
      return await updateMapShape(sid, {
        coordinates: shape.coordinates,
        properties: shape.properties,
      });
    } else {
      const saved = await saveMapShape(shape);
      propagateShapeId(layer, saved.id);
      return saved;
    }
  };

  // Ensure every drawable sub-layer carries the shapeId for event handlers
  function propagateShapeId(layer: any, id: string) {
    if (!layer) return;
    (layer as any)._shapeId = id;
    if (layer.options) (layer.options as any).shapeId = id;
    if (layer.feature && layer.feature.properties) {
      layer.feature.properties._shapeId = id;
    }
    if (layer.getLayers) {
      layer.getLayers().forEach((sub: any) => propagateShapeId(sub, id));
    }

    // After ensuring id, bind change events
    attachPersistenceEvents(layer);
  }

  function attachPersistenceEvents(layer: any) {
    if (!layer || !layer.pm) return;

    // avoid duplicate
    layer.off('pm:change', onLayerChange);
    layer.off('pm:dragend', onLayerChange);

    layer.on('pm:change', onLayerChange);
    layer.on('pm:dragend', onLayerChange);
  }

  const onLayerChange = async (e: any) => {
    const layer = e.layer || e.target;
    await saveOrUpdateLayer(layer);
  };

  // Helper to retrieve shapeId from any layer variant
  const getShapeId = (layer: any): string | undefined => {
    return (
      (layer as any)._shapeId ||
      layer?.options?.shapeId ||
      layer?.feature?.properties?._shapeId
    );
  };

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
          Shapes: {shapeCount}
        </div>
        
        {/* Auto-save is always on; checkbox removed */}
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

        ${textMarkerStyles}
      `}</style>
      
      <GeomanMap onMapReady={setMapInstance} />
    </>
  );
}
