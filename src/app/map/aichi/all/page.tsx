'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getBoardPins, getProgress, getProgressCountdown, getVoteVenuePins, getAreaList } from '@/lib/api';
import { getStatusText, getStatusColor, createProgressBox, createProgressBoxCountdown, createBaseLayers, createGrayIcon } from '@/lib/map-utils';
import { PinData, VoteVenue, AreaList } from '@/lib/types';

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

interface MapConfig {
  [key: string]: {
    lat: number;
    long: number;
    zoom: number;
  };
}

const mapConfig: MapConfig = {
  'nagoya': { lat: 35.1814, long: 136.9064, zoom: 12 },
  'toyohashi': { lat: 34.7636, long: 137.3828, zoom: 12 },
  'okazaki': { lat: 34.9461, long: 137.1653, zoom: 12 },
  'ichinomiya': { lat: 35.3000, long: 136.8000, zoom: 12 },
  'seto': { lat: 35.2281, long: 137.0917, zoom: 12 },
  'handa': { lat: 34.9083, long: 136.9367, zoom: 12 },
  'kasugai': { lat: 35.2333, long: 136.9667, zoom: 12 },
  'toyokawa': { lat: 34.8167, long: 137.3833, zoom: 12 },
  'tsushima': { lat: 35.1861, long: 136.7214, zoom: 12 },
  'hekinan': { lat: 34.8833, long: 136.9833, zoom: 12 },
  'kariya': { lat: 34.9833, long: 137.0000, zoom: 12 },
  'toyota': { lat: 35.0833, long: 137.1167, zoom: 12 },
  'anjo': { lat: 34.9500, long: 137.0833, zoom: 12 },
  'nishio': { lat: 34.8833, long: 137.0500, zoom: 12 },
  'gamagori': { lat: 34.8167, long: 137.2167, zoom: 12 },
  'inuyama': { lat: 35.3833, long: 136.9333, zoom: 12 },
  'tokoname': { lat: 34.8944, long: 136.8403, zoom: 12 },
  'konan': { lat: 35.3500, long: 136.8667, zoom: 12 },
  'komaki': { lat: 35.2833, long: 136.9167, zoom: 12 },
  'inazawa': { lat: 35.2500, long: 136.7833, zoom: 12 },
  'shinshiro': { lat: 34.9000, long: 137.4833, zoom: 12 },
  'tokai': { lat: 34.9833, long: 136.8833, zoom: 12 },
  'obu': { lat: 35.0167, long: 136.9500, zoom: 12 },
  'chita': { lat: 34.9000, long: 136.8333, zoom: 12 },
  'chiryu': { lat: 35.0000, long: 137.0500, zoom: 12 },
  'owariasahi': { lat: 35.2000, long: 137.0333, zoom: 12 },
  'takahama': { lat: 34.9167, long: 136.9833, zoom: 12 },
  'iwakura': { lat: 35.2833, long: 136.8667, zoom: 12 },
  'toyoake': { lat: 35.0667, long: 137.0167, zoom: 12 },
  'nisshin': { lat: 35.1667, long: 137.0333, zoom: 12 },
  'tahara': { lat: 34.6667, long: 137.2667, zoom: 12 },
  'aisai': { lat: 35.2000, long: 136.6833, zoom: 12 },
  'kiyosu': { lat: 35.2000, long: 136.8500, zoom: 12 },
  'kitanagoya': { lat: 35.2500, long: 136.8833, zoom: 12 },
  'yatomi': { lat: 35.1000, long: 136.7000, zoom: 12 },
  'miyoshi': { lat: 35.0833, long: 137.0500, zoom: 12 },
  'ama': { lat: 35.1833, long: 136.7500, zoom: 12 },
  'nagakute': { lat: 35.1833, long: 137.0500, zoom: 12 },
  'togo': { lat: 35.0833, long: 137.0167, zoom: 12 },
  'toyoyama': { lat: 35.2500, long: 136.9000, zoom: 12 },
  'oguchi': { lat: 35.3500, long: 136.9000, zoom: 12 },
  'fuso': { lat: 35.3833, long: 136.8833, zoom: 12 },
  'ofuji': { lat: 35.1500, long: 136.9500, zoom: 12 }, // 大治町
  'kanie': { lat: 35.1167, long: 136.7833, zoom: 12 },
  'tobishima': { lat: 35.0667, long: 136.7500, zoom: 12 },
  'agui': { lat: 34.8500, long: 136.9000, zoom: 12 },
  'higashiura': { lat: 34.9333, long: 136.9500, zoom: 12 },
  'minamichita': { lat: 34.7000, long: 136.9167, zoom: 12 },
  'mihama': { lat: 34.7333, long: 136.9500, zoom: 12 },
  'taketoyo': { lat: 34.8500, long: 136.9167, zoom: 12 },
  'kota': { lat: 34.8333, long: 137.1667, zoom: 12 },
  'shitara': { lat: 35.0000, long: 137.6000, zoom: 12 },
  'toei': { lat: 35.0500, long: 137.7667, zoom: 12 },
  'toyone': { lat: 35.1000, long: 137.7500, zoom: 12 },
};

function getPinNote(note: string | null): string {
  return note == null ? "なし" : note;
}

async function loadBoardPins(pins: PinData[], layer: any, areaList: AreaList, L: any, status: number | null = null) {
  const filteredPins = status !== null ? pins.filter(item => item.status === status) : pins;
  
  filteredPins.forEach(pin => {
    const marker = L.circleMarker([pin.lat, pin.long], {
      radius: 8,
      color: 'black',
      weight: 1,
      fillColor: getStatusColor(pin.status),
      fillOpacity: 0.9,
    }).addTo(layer);
    
    const areaName = areaList[String(pin.area_id)]?.area_name || '不明';
    marker.bindPopup(`
      <b>${areaName} ${pin.name}</b><br>
      ステータス: ${getStatusText(pin.status)}<br>
      備考: ${getPinNote((pin as any).note)}<br>
      座標: <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a>
    `);
  });
}

async function loadVoteVenuePins(layer: any, L: any, area:string | null = null) {
  const pins = await getVoteVenuePins(area);
  const grayIcon = createGrayIcon(L);
  pins.forEach(pin => {
    const marker = L.marker([pin.lat, pin.long], {
      icon: grayIcon
    }).addTo(layer);
    marker.bindPopup(`
      <b>期日前投票所: ${pin.name}</b><br>
      ${pin.address}<br>
      期間: ${pin.period}<br>
      <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a>
    `);
  });
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const [mapInstance, setMapInstance] = useState<any>(null);

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
        '期日前投票所': L.layerGroup(),
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
        
        if (block && mapConfig[block]) {
          latlong = [mapConfig[block].lat, mapConfig[block].long];
          zoom = mapConfig[block].zoom;
        } else {
          latlong = [35.03920084807384, 137.2447806134087];
          zoom = 9;
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
        // Load board pins
        const area = "aichi"
        const pins = await getBoardPins(block, smallBlock, area);
        const areaList = await getAreaList(area);
        
        await loadBoardPins(pins, overlays['削除'], areaList, L, 6);
        await loadBoardPins(pins, overlays['完了'], areaList, L, 1);
        await loadBoardPins(pins, overlays['異常'], areaList, L, 2);
        await loadBoardPins(pins, overlays['要確認'], areaList, L, 4);
        await loadBoardPins(pins, overlays['異常対応中'], areaList, L, 5);
        await loadBoardPins(pins, overlays['未'], areaList, L, 0);

        // Load progress data
        const [progress, progressCountdown] = await Promise.all([
          getProgress(area),
          getProgressCountdown(area)
        ]);

        createProgressBox(L, Number((progress.total * 100).toFixed(2)), 'topleft').addTo(mapInstance);
        createProgressBoxCountdown(L, parseInt(progressCountdown.total.toString()), 'topleft').addTo(mapInstance);

        // Load vote venue pins
        // await loadVoteVenuePins(overlays['期日前投票所'], L,area);

      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    initializeMap();
  }, [mapInstance, block, smallBlock]);

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

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapPageContent />
    </Suspense>
  );
}