'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getBoardPins, getProgress, getProgressCountdown, getVoteVenuePins, getAreaList } from '@/lib/api';
import { getStatusText, getStatusColor, createProgressBox, createProgressBoxCountdown, createBaseLayers, createGrayIcon } from '@/lib/map-utils';
import { PinData, VoteVenue, AreaList } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface MapConfig {
  [key: string]: {
    lat: number;
    long: number;
    zoom: number;
  };
}

const mapConfig: MapConfig = {
  'osaka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'sakai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kishiwada': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'toyonaka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ikeda': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'suita': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'izumiotsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'takatsuki': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kaizuka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'moriguchi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hirakata': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ibaraki': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'yao': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'izumisano': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tondabayashi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'neyagawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kawachinagano': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'matsubara': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'daito': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'izumi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'minoh': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kashiwara': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'habikino': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kadoma': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'settsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'takaishi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'fujiidera': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'higashiosaka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'sennan': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shijonawate': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'katano': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'osakasayama': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hannan': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shimamoto': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'toyono': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nose': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tadaoka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kumatori': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tajiri': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'misaki': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'taishi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kanan': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'chihayaakasaka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
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

async function loadVoteVenuePins(layer: any, L: any, area:string | null = "") {
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
          latlong = [34.63952534338718, 135.5126257831636];
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

      mapInstance.on('locationerror', setInitialView);
      mapInstance.locate({ setView: false, maxZoom: 14 });

      try {
        // Load board pins
        // const area = "kanto/chiba"
        // const pins = await getBoardPins(block, smallBlock, area);
        // const areaList = await getAreaList(area);
        
        // await loadBoardPins(pins, overlays['削除'], areaList, L, 6);
        // await loadBoardPins(pins, overlays['完了'], areaList, L, 1);
        // await loadBoardPins(pins, overlays['異常'], areaList, L, 2);
        // await loadBoardPins(pins, overlays['要確認'], areaList, L, 4);
        // await loadBoardPins(pins, overlays['異常対応中'], areaList, L, 5);
        // await loadBoardPins(pins, overlays['未'], areaList, L, 0);

        // Load progress data
        // const [progress, progressCountdown] = await Promise.all([
        //   getProgress(area),
        //   getProgressCountdown(area)
        // ]);

        // createProgressBox(L, Number((progress.total * 100).toFixed(2)), 'topleft').addTo(mapInstance);
        // createProgressBoxCountdown(L, parseInt(progressCountdown.total.toString()), 'topleft').addTo(mapInstance);

        // Load vote venue pins
        // await loadVoteVenuePins(overlays['期日前投票所'], L);

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
      <Map onMapReady={setMapInstance} />
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