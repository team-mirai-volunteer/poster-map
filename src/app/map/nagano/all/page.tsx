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
  'nagano': { lat: 36.6500, long: 138.1833, zoom: 12 },
  'matsumoto': { lat: 36.2306, long: 137.9672, zoom: 12 },
  'ueda': { lat: 36.3989, long: 138.2522, zoom: 12 },
  'okaya': { lat: 36.0692, long: 138.0436, zoom: 12 },
  'iida': { lat: 35.5167, long: 137.8167, zoom: 12 },
  'suwa': { lat: 36.0361, long: 138.1139, zoom: 12 },
  'suzaka': { lat: 36.6575, long: 138.3072, zoom: 12 },
  'komoro': { lat: 36.3264, long: 138.4231, zoom: 12 },
  'ina': { lat: 35.8000, long: 137.9500, zoom: 12 },
  'komagane': { lat: 35.7333, long: 137.9333, zoom: 12 },
  'nakano': { lat: 36.7583, long: 138.3750, zoom: 12 },
  'omachi': { lat: 36.5000, long: 137.8500, zoom: 12 },
  'iiyama': { lat: 36.8406, long: 138.3619, zoom: 12 },
  'chino': { lat: 36.0000, long: 138.1500, zoom: 12 },
  'shiojiri': { lat: 36.1158, long: 137.9525, zoom: 12 },
  'saku': { lat: 36.2647, long: 138.4831, zoom: 12 },
  'chikuma': { lat: 36.5297, long: 138.1169, zoom: 12 },
  'tomi': { lat: 36.3333, long: 138.3333, zoom: 12 },
  'azumino': { lat: 36.3333, long: 137.9000, zoom: 12 },
  'koumi': { lat: 36.0000, long: 138.4667, zoom: 12 },
  'kawakami': { lat: 35.9167, long: 138.5667, zoom: 12 },
  'minamimaki': { lat: 36.0333, long: 138.4833, zoom: 12 },
  'minamiaiki': { lat: 36.0000, long: 138.5667, zoom: 12 },
  'kitaaiki': { lat: 36.1000, long: 138.5667, zoom: 12 },
  'sakuho': { lat: 36.1500, long: 138.4500, zoom: 12 },
  'karuizawa': { lat: 36.3422, long: 138.6361, zoom: 12 },
  'miyota': { lat: 36.3000, long: 138.4000, zoom: 12 },
  'tateshina': { lat: 36.0667, long: 138.3167, zoom: 12 },
  'aoki': { lat: 36.3000, long: 138.0833, zoom: 12 },
  'nagawa': { lat: 36.1000, long: 138.2500, zoom: 12 },
  'shimosuwa': { lat: 36.0667, long: 138.0833, zoom: 12 },
  'fujimi': { lat: 35.9000, long: 138.2000, zoom: 12 },
  'hara': { lat: 35.9667, long: 138.2000, zoom: 12 },
  'tatsuno': { lat: 35.9833, long: 137.9500, zoom: 12 },
  'minowa': { lat: 35.8833, long: 137.9333, zoom: 12 },
  'iijima': { lat: 35.6500, long: 137.8500, zoom: 12 },
  'minamiminowa': { lat: 35.8000, long: 137.9667, zoom: 12 },
  'nakagawa': { lat: 35.6167, long: 137.8833, zoom: 12 },
  'miyada': { lat: 35.7000, long: 137.9167, zoom: 12 },
  'matsukawa': { lat: 35.5333, long: 137.8000, zoom: 12 },
  'takamori': { lat: 35.5000, long: 137.8333, zoom: 12 },
  'anan': { lat: 35.2667, long: 137.8500, zoom: 12 },
  'achi': { lat: 35.3333, long: 137.8000, zoom: 12 },
  'hiraya': { lat: 35.2500, long: 137.6667, zoom: 12 },
  'neba': { lat: 35.1500, long: 137.7667, zoom: 12 },
  'shimojo': { lat: 35.4333, long: 137.7833, zoom: 12 },
  'urugi': { lat: 35.1500, long: 137.7000, zoom: 12 },
  'tenryu': { lat: 35.2000, long: 137.8500, zoom: 12 },
  'yasuoka': { lat: 35.2000, long: 137.8000, zoom: 12 },
  'takagi': { lat: 35.5000, long: 137.8667, zoom: 12 },
  'toyooka': { lat: 35.4500, long: 137.8667, zoom: 12 },
  'ooshika': { lat: 35.3667, long: 138.0000, zoom: 12 },
  'agematsu': { lat: 35.8333, long: 137.7000, zoom: 12 },
  'nagiso': { lat: 35.6000, long: 137.6000, zoom: 12 },
  'kiso-mura': { lat: 35.8667, long: 137.7667, zoom: 12 },
  'otaki': { lat: 35.8667, long: 137.5833, zoom: 12 },
  'okuwa': { lat: 35.8000, long: 137.6500, zoom: 12 },
  'kiso': { lat: 35.9167, long: 137.7167, zoom: 12 },
  'omi': { lat: 36.2333, long: 137.8333, zoom: 12 },
  'ikusaka': { lat: 36.2667, long: 137.9000, zoom: 12 },
  'yamagata': { lat: 36.2000, long: 137.8500, zoom: 12 },
  'asahi': { lat: 36.1667, long: 137.7500, zoom: 12 },
  'chikuhoku': { lat: 36.4333, long: 138.0000, zoom: 12 },
  'ikeda': { lat: 36.3500, long: 137.9167, zoom: 12 },
  'matsukawa-mura': { lat: 36.4667, long: 137.8667, zoom: 12 },
  'hakuba': { lat: 36.7000, long: 137.8500, zoom: 12 },
  'otari': { lat: 36.8500, long: 137.9167, zoom: 12 },
  'sakaki': { lat: 36.4500, long: 138.1667, zoom: 12 },
  'obuse': { lat: 36.6833, long: 138.2972, zoom: 12 },
  'takayama': { lat: 36.7000, long: 138.3500, zoom: 12 },
  'yamanouchi': { lat: 36.7500, long: 138.4500, zoom: 12 },
  'kijimadaira': { lat: 36.8500, long: 138.4500, zoom: 12 },
  'nozawaonsen': { lat: 36.9333, long: 138.4500, zoom: 12 },
  'shinano': { lat: 36.7667, long: 138.1500, zoom: 12 },
  'ogawa': { lat: 36.6500, long: 138.0000, zoom: 12 },
  'iizuna': { lat: 36.7000, long: 138.2000, zoom: 12 },
  'sakae': { lat: 37.0000, long: 138.5667, zoom: 12 },
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
          latlong = [36.0938801624127, 138.05839733309958];
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
        const area = "nagano"
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