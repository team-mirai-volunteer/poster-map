'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getStatusText, getStatusColor, createProgressBox, createProgressBoxCountdown, createBaseLayers } from '@/lib/map-utils';
import { PinData, AreaList } from '@/lib/types';
import { getPrefectureConfig } from '@/lib/prefecture-config';
import { PrefectureData } from '@/lib/server-data';

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

function getPinNote(note: string | null): string {
  return note == null ? "なし" : note;
}

async function loadBoardPins(pins: PinData[], layer: any, areaList: AreaList, L: any, status: number | null = null) {
  const filteredPins = status !== null ? pins.filter(item => item.status === status) : pins;
  
  filteredPins.forEach(pin => {
    const lat = Number(pin.lat);
    const lng = Number(pin.long);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`Invalid pin lat/lng:`, pin);
      return;
    }
    const marker = L.circleMarker([pin.lat, pin.long], {
      radius: 8,
      color: 'black',
      weight: 1,
      fillColor: getStatusColor(pin.status),
      fillOpacity: 0.9,
    }).addTo(layer);
    
    const areaName = areaList[pin.area_id]?.area_name || '不明';
    marker.bindPopup(`
      <b>${areaName} ${pin.name}</b><br>
      ステータス: ${getStatusText(pin.status)}<br>
      備考: ${getPinNote((pin as any).note)}<br>
      座標: <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a>
    `);
  });
}

function MapPageContent({ prefecture, prefectureData }: { prefecture: string; prefectureData: PrefectureData }) {
  const searchParams = useSearchParams();
  const [mapInstance, setMapInstance] = useState<any>(null);
  
  const prefectureConfig = getPrefectureConfig(prefecture);
  if (!prefectureConfig) {
    notFound();
  }

  const block = searchParams.get('block');
  const smallBlock = searchParams.get('sb');

  useEffect(() => {
    if (!mapInstance) return;

    const initializeMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Create overlay layers
      const overlays = {
        '未': L.layerGroup(),
        '完了': L.layerGroup(),
        '異常': L.layerGroup(),
        '要確認': L.layerGroup(),
        '異常対応中': L.layerGroup(),
        '削除': L.layerGroup(),
      };

      // Add all overlays to map
      Object.values(overlays).forEach(layer => layer.addTo(mapInstance));

      // Add base layer
      const baseLayers = createBaseLayers(L);
      baseLayers.japanBaseMap.addTo(mapInstance);

      // Add layer control
      const layerControl = L.control.layers(
        {
          'OpenStreetMap': baseLayers.osm,
          'Google Map': baseLayers.googleMap,
          '国土地理院地図': baseLayers.japanBaseMap,
        },
        overlays
      ).addTo(mapInstance);

      // Set initial view based on block parameter
      const setInitialView = () => {
        let latlong: [number, number];
        let zoom: number;
        
        if (block && prefectureConfig.blocks) {
          const blockConfig = prefectureConfig.blocks.find(b => b.id === block);
          if (blockConfig && blockConfig.lat && blockConfig.long && blockConfig.zoom) {
            latlong = [blockConfig.lat, blockConfig.long];
            zoom = blockConfig.zoom;
          } else {
            latlong = [prefectureConfig.defaultLat, prefectureConfig.defaultLong];
            zoom = prefectureConfig.defaultZoom;
          }
        } else {
          latlong = [prefectureConfig.defaultLat, prefectureConfig.defaultLong];
          zoom = prefectureConfig.defaultZoom;
        }
        
        mapInstance.setView(latlong, zoom);
      };

      // Handle geolocation
      mapInstance.on('locationfound', (e: any) => {
        const radius = e.accuracy;
        L.marker(e.latlng).addTo(mapInstance)
          .bindPopup(`You are within ${radius} meters from this point`).openPopup();
        L.circle(e.latlng, radius).addTo(mapInstance);
      });

      // mapInstance.on('locationerror', setInitialView);
      setInitialView();
      mapInstance.locate({ setView: false, maxZoom: 14 });

      try {
        // Use pre-loaded data
        const { pins, areaList, progress, progressCountdown } = prefectureData;
        
        // Filter pins by block if needed
        let filteredPins = pins;
        if (block && prefectureConfig.blocks) {
          // TODO: Implement block filtering based on prefecture config
          // For now, use all pins
        }
        
        await loadBoardPins(filteredPins, overlays['削除'], areaList, L, 6);
        await loadBoardPins(filteredPins, overlays['完了'], areaList, L, 1);
        await loadBoardPins(filteredPins, overlays['異常'], areaList, L, 2);
        await loadBoardPins(filteredPins, overlays['要確認'], areaList, L, 4);
        await loadBoardPins(filteredPins, overlays['異常対応中'], areaList, L, 5);
        await loadBoardPins(filteredPins, overlays['未'], areaList, L, 0);

        // Use pre-loaded progress data
        createProgressBox(L, Number((progress.total * 100).toFixed(2)), 'topleft').addTo(mapInstance);
        createProgressBoxCountdown(L, parseInt(progressCountdown.total.toString()), 'topleft').addTo(mapInstance);

      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    initializeMap();
  }, [mapInstance, block, smallBlock, prefecture, prefectureConfig, prefectureData]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }
        #map {
          width: 100%;
          height: 100vh;
        }
        .icon-gray {
          filter: grayscale(100%);
        }
        .info {
          color: #333;
          background: white;
          padding: 10px;
          border: 1px solid #5d5d5d;
          border-radius: 4px;
          width: 72px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .info p {
          padding: 0;
          margin: 0 0 2px 0;
          font-weight: bold;
        }
        .progressValue {
          font-size: 25px;
          line-height: 1;
          margin: 0;
        }
        @media (max-width: 767px) {
          .info {
            padding: 7px;
          }
          .progressValue {
            font-size: 25px;
          }
        }
      `}</style>
      <LeafletMap onMapReady={setMapInstance} />
    </>
  );
}

export default function MapClient({ prefecture, prefectureData }: { prefecture: string; prefectureData: PrefectureData }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapPageContent prefecture={prefecture} prefectureData={prefectureData} />
    </Suspense>
  );
}