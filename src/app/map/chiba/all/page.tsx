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
  'chiba-chuo': { lat: 35.6049, long: 140.1235, zoom: 13 },
  'chiba-hanamigawa': { lat: 35.6786, long: 140.0944, zoom: 13 },
  'chiba-inage': { lat: 35.6496, long: 140.1128, zoom: 13 },
  'chiba-wakaba': { lat: 35.6079, long: 140.2090, zoom: 13 },
  'chiba-midori': { lat: 35.5484, long: 140.2358, zoom: 13 },
  'chiba-mihama': { lat: 35.6341, long: 140.0627, zoom: 13 },
  'choshi': { lat: 35.7336, long: 140.8256, zoom: 13 },
  'ichikawa': { lat: 35.7202, long: 139.9079, zoom: 13 },
  'funabashi': { lat: 35.6983, long: 139.9867, zoom: 13 },
  'tateyama': { lat: 34.9928, long: 139.8661, zoom: 13 },
  'kisarazu': { lat: 35.3789, long: 139.9328, zoom: 13 },
  'matsudo': { lat: 35.7836, long: 139.9025, zoom: 13 },
  'noda': { lat: 35.9458, long: 139.8583, zoom: 13 },
  'mobara': { lat: 35.4208, long: 140.2975, zoom: 13 },
  'narita': { lat: 35.7797, long: 140.3019, zoom: 13 },
  'sakura': { lat: 35.7225, long: 140.2333, zoom: 13 },
  'togane': { lat: 35.6267, long: 140.3608, zoom: 13 },
  'asahi': { lat: 35.7192, long: 140.6483, zoom: 13 },
  'narashino': { lat: 35.6839, long: 140.0211, zoom: 13 },
  'kashiwa': { lat: 35.8625, long: 139.9719, zoom: 13 },
  'katsuura': { lat: 35.1381, long: 140.3167, zoom: 13 },
  'ichihara': { lat: 35.4972, long: 140.1194, zoom: 13 },
  'nagareyama': { lat: 35.8600, long: 139.9000, zoom: 13 },
  'yachiyo': { lat: 35.7483, long: 140.1069, zoom: 13 },
  'abiko': { lat: 35.8828, long: 140.0389, zoom: 13 },
  'kamogawa': { lat: 35.1097, long: 140.1028, zoom: 13 },
  'kamagaya': { lat: 35.7878, long: 140.0092, zoom: 13 },
  'kimitsu': { lat: 35.3333, long: 139.9333, zoom: 13 },
  'futtsu': { lat: 35.3167, long: 139.8667, zoom: 13 },
  'urayasu': { lat: 35.6567, long: 139.8856, zoom: 13 },
  'yotsukaido': { lat: 35.6767, long: 140.1800, zoom: 13 },
  'sodegaura': { lat: 35.4333, long: 139.9667, zoom: 13 },
  'inzai': { lat: 35.8167, long: 140.1667, zoom: 13 },
  'shiroi': { lat: 35.8167, long: 140.0667, zoom: 13 },
  'tomisato': { lat: 35.7333, long: 140.3167, zoom: 13 },
  'minamiboso': { lat: 35.0000, long: 139.9000, zoom: 13 },
  'sosa': { lat: 35.7000, long: 140.5167, zoom: 13 },
  'katori': { lat: 35.8833, long: 140.5000, zoom: 13 },
  'sanmu': { lat: 35.6167, long: 140.4000, zoom: 13 },
  'isumi': { lat: 35.2500, long: 140.3667, zoom: 13 },
  'oamishirasato': { lat: 35.5333, long: 140.2833, zoom: 13 },
  'shisui': { lat: 35.7333, long: 140.2333, zoom: 13 },
  'sakae': { lat: 35.8500, long: 140.2167, zoom: 13 },
  'kozaki': { lat: 35.8667, long: 140.3833, zoom: 13 }, // 神崎町 (Kanzaki-machi)
  'tako': { lat: 35.7333, long: 140.4500, zoom: 13 },
  'tojo': { lat: 35.8000, long: 140.6667, zoom: 13 }, // 東庄町 (Tojo-machi)
  'kujukuri': { lat: 35.5333, long: 140.4167, zoom: 13 },
  'shibayama': { lat: 35.7167, long: 140.3833, zoom: 13 },
  'yokoshibahikari': { lat: 35.6500, long: 140.4667, zoom: 13 },
  'ichinomiya': { lat: 35.3333, long: 140.3667, zoom: 13 },
  'mutsuzawa': { lat: 35.3833, long: 140.3000, zoom: 13 },
  'chosei': { lat: 35.3667, long: 140.3333, zoom: 13 },
  'shirako': { lat: 35.4500, long: 140.3500, zoom: 13 },
  'nagara': { lat: 35.4500, long: 140.2000, zoom: 13 },
  'chonan': { lat: 35.3833, long: 140.2333, zoom: 13 },
  'otaki': { lat: 35.2000, long: 140.1667, zoom: 13 },
  'onjuku': { lat: 35.1500, long: 140.3500, zoom: 13 },
  'kyonan': { lat: 35.1000, long: 139.8167, zoom: 13 },
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
          latlong = [35.53276637421852, 140.25952167603137];
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
        const area = "chiba"
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