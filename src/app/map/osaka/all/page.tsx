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
  'osaka': { lat: 34.6937, long: 135.5022, zoom: 12 },
  'sakai': { lat: 34.5667, long: 135.4833, zoom: 12 },
  'kishiwada': { lat: 34.4594, long: 135.3725, zoom: 12 },
  'toyonaka': { lat: 34.7833, long: 135.4833, zoom: 12 },
  'ikeda': { lat: 34.8211, long: 135.4292, zoom: 12 },
  'suita': { lat: 34.7578, long: 135.5097, zoom: 12 },
  'izumiotsu': { lat: 34.4981, long: 135.4056, zoom: 12 },
  'takatsuki': { lat: 34.8500, long: 135.6167, zoom: 12 },
  'kaizuka': { lat: 34.4444, long: 135.3533, zoom: 12 },
  'moriguchi': { lat: 34.7431, long: 135.5681, zoom: 12 },
  'hirakata': { lat: 34.8092, long: 135.6594, zoom: 12 },
  'ibaraki': { lat: 34.8106, long: 135.5672, zoom: 12 },
  'yao': { lat: 34.6292, long: 135.6028, zoom: 12 },
  'izumisano': { lat: 34.4092, long: 135.3092, zoom: 12 },
  'tondabayashi': { lat: 34.5078, long: 135.6028, zoom: 12 },
  'neyagawa': { lat: 34.7569, long: 135.6044, zoom: 12 },
  'kawachinagano': { lat: 34.4419, long: 135.5658, zoom: 12 },
  'matsubara': { lat: 34.5719, long: 135.5453, zoom: 12 },
  'daito': { lat: 34.7167, long: 135.6333, zoom: 12 },
  'izumi': { lat: 34.4667, long: 135.4667, zoom: 12 },
  'minoh': { lat: 34.8333, long: 135.4667, zoom: 12 },
  'kashiwara': { lat: 34.5667, long: 135.6278, zoom: 12 },
  'habikino': { lat: 34.5500, long: 135.6000, zoom: 12 },
  'kadoma': { lat: 34.7214, long: 135.5861, zoom: 12 },
  'settsu': { lat: 34.7667, long: 135.5833, zoom: 12 },
  'takaishi': { lat: 34.5367, long: 135.4244, zoom: 12 },
  'fujiidera': { lat: 34.5694, long: 135.5889, zoom: 12 },
  'higashiosaka': { lat: 34.6750, long: 135.5997, zoom: 12 },
  'sennan': { lat: 34.3411, long: 135.2017, zoom: 12 },
  'shijonawate': { lat: 34.7500, long: 135.6500, zoom: 12 },
  'katano': { lat: 34.7833, long: 135.6833, zoom: 12 },
  'osakasayama': { lat: 34.4944, long: 135.5564, zoom: 12 },
  'hannan': { lat: 34.3167, long: 135.2167, zoom: 12 },
  'shimamoto': { lat: 34.8833, long: 135.6667, zoom: 12 },
  'toyono': { lat: 34.9333, long: 135.4500, zoom: 12 },
  'nose': { lat: 34.9833, long: 135.4000, zoom: 12 },
  'tadaoka': { lat: 34.5097, long: 135.4011, zoom: 12 },
  'kumatori': { lat: 34.4167, long: 135.3917, zoom: 12 },
  'tajiri': { lat: 34.4000, long: 135.2667, zoom: 12 },
  'misaki': { lat: 34.3000, long: 135.1500, zoom: 12 },
  'taishi': { lat: 34.4833, long: 135.6000, zoom: 12 },
  'kanan': { lat: 34.4667, long: 135.6167, zoom: 12 },
  'chihayaakasaka': { lat: 34.4000, long: 135.6500, zoom: 12 },
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
    
    const areaName = areaList[pin.area_id]?.area_name || '不明';
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
          latlong = [34.70031413852008, 135.5700740417756];
          zoom = 10;
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
        const area = "osaka"
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
        // await loadVoteVenuePins(overlays['期日前投票所'], L, area);

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