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
  'kitakyushu': { lat: 33.8829, long: 130.8722, zoom: 12 },
  'fukuoka': { lat: 33.5903, long: 130.4017, zoom: 12 },
  'omuta': { lat: 33.0458, long: 130.4431, zoom: 12 },
  'kurume': { lat: 33.3172, long: 130.5056, zoom: 12 },
  'nogata': { lat: 33.7381, long: 130.7397, zoom: 12 },
  'iizuka': { lat: 33.6425, long: 130.6847, zoom: 12 },
  'tagawa': { lat: 33.6331, long: 130.8258, zoom: 12 },
  'yanagawa': { lat: 33.1558, long: 130.4031, zoom: 12 },
  'yame': { lat: 33.2044, long: 130.5692, zoom: 12 },
  'chikugo': { lat: 33.2033, long: 130.5406, zoom: 12 },
  'okawa': { lat: 33.2103, long: 130.3800, zoom: 12 },
  'yukuhashi': { lat: 33.7297, long: 130.9858, zoom: 12 },
  'buzen': { lat: 33.6067, long: 131.0969, zoom: 12 },
  'nakama': { lat: 33.8111, long: 130.7225, zoom: 12 },
  'ogori': { lat: 33.4072, long: 130.5622, zoom: 12 },
  'chikushino': { lat: 33.4875, long: 130.5347, zoom: 12 },
  'kasuga': { lat: 33.5350, long: 130.4450, zoom: 12 },
  'onojo': { lat: 33.5303, long: 130.4939, zoom: 12 },
  'munakata': { lat: 33.8133, long: 130.5375, zoom: 12 },
  'dazaifu': { lat: 33.5119, long: 130.5217, zoom: 12 },
  'koga': { lat: 33.7469, long: 130.4686, zoom: 12 },
  'fukutsu': { lat: 33.7872, long: 130.4917, zoom: 12 },
  'ukiha': { lat: 33.3653, long: 130.7719, zoom: 12 },
  'miyawaka': { lat: 33.7547, long: 130.6406, zoom: 12 },
  'kama': { lat: 33.5500, long: 130.7000, zoom: 12 },
  'asakura': { lat: 33.4283, long: 130.6728, zoom: 12 },
  'miyama': { lat: 33.1072, long: 130.4858, zoom: 12 },
  'itoshima': { lat: 33.5678, long: 130.1878, zoom: 12 },
  'nakagawa': { lat: 33.4619, long: 130.4403, zoom: 12 },
  'umi': { lat: 33.5514, long: 130.5394, zoom: 12 },
  'sasaguri': { lat: 33.6267, long: 130.5317, zoom: 12 },
  'shime': { lat: 33.5694, long: 130.5186, zoom: 12 },
  'sue': { lat: 33.5936, long: 130.5194, zoom: 12 },
  'shingu': { lat: 33.7150, long: 130.4358, zoom: 12 },
  'hisayama': { lat: 33.6333, long: 130.5000, zoom: 12 },
  'kasuya': { lat: 33.6236, long: 130.4878, zoom: 12 },
  'ashiya': { lat: 33.9167, long: 130.6667, zoom: 12 },
  'mizumaki': { lat: 33.8647, long: 130.7136, zoom: 12 },
  'okagaki': { lat: 33.8767, long: 130.6186, zoom: 12 },
  'onga': { lat: 33.8667, long: 130.6833, zoom: 12 },
  'otakemachi': { lat: 33.8058, long: 130.8258, zoom: 12 }, // 大任町
  'kurate': { lat: 33.8000, long: 130.6500, zoom: 12 },
  'keisen': { lat: 33.6333, long: 130.6500, zoom: 12 },
  'chikuzen': { lat: 33.4472, long: 130.6389, zoom: 12 },
  'toho': { lat: 33.4500, long: 130.8500, zoom: 12 },
  'otachi arai': { lat: 33.3500, long: 130.5333, zoom: 12 }, // 大刀洗町
  'oki': { lat: 33.2428, long: 130.4072, zoom: 12 }, // 大木町
  'hirokawa': { lat: 33.2500, long: 130.5500, zoom: 12 }, // 広川町
  'kawara': { lat: 33.6333, long: 130.7500, zoom: 12 },
  'soeda': { lat: 33.5667, long: 130.8500, zoom: 12 },
  'itoda': { lat: 33.6333, long: 130.7833, zoom: 12 },
  'kawasaki': { lat: 33.5833, long: 130.8500, zoom: 12 },
  'otomo': { lat: 33.6667, long: 130.8000, zoom: 12 }, // 添田町大字津野（添田町）
  'aka': { lat: 33.5833, long: 130.9000, zoom: 12 },
  'fukuchi': { lat: 33.6700, long: 130.8033, zoom: 12 },
  'kanda': { lat: 33.8500, long: 130.9500, zoom: 12 },
  'miyako': { lat: 33.6333, long: 130.9500, zoom: 12 },
  'yoshitomi': { lat: 33.5833, long: 131.0000, zoom: 12 },
  'koge': { lat: 33.5667, long: 130.9833, zoom: 12 }, // 上毛町
  'chikujo': { lat: 33.5667, long: 130.9833, zoom: 12 },
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
          latlong = [33.53620576014202, 130.6900353502292];
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
        const area = "fukuoka"
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