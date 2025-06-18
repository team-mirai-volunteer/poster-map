'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getBoardPins, getProgress, getProgressCountdown, getVoteVenuePins, getAreaList } from '@/lib/api';
import { getStatusText, getStatusColor, createProgressBox, createProgressBoxCountdown, createBaseLayers, createGrayIcon } from '@/lib/map-utils';
import { PinData, VoteVenue, AreaList } from '@/lib/types';
import { escape } from 'querystring';

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

interface MapConfig {
  [key: string]: {
    lat: number;
    long: number;
    zoom: number;
  };
}

const mapConfig: MapConfig = {
  'sendai': { lat: 38.2688, long: 140.8720, zoom: 12 },
  'ishinomaki': { lat: 38.4350, long: 141.3033, zoom: 12 },
  'shiogama': { lat: 38.2325, long: 141.0264, zoom: 12 },
  'kesennuma': { lat: 38.9056, long: 141.5642, zoom: 12 },
  'shiroishi': { lat: 38.0053, long: 140.6275, zoom: 12 },
  'natori': { lat: 38.1708, long: 140.8808, zoom: 12 },
  'kakuda': { lat: 37.9733, long: 140.7817, zoom: 12 },
  'tagajo': { lat: 38.2706, long: 141.0028, zoom: 12 },
  'iwanuma': { lat: 38.1092, long: 140.8711, zoom: 12 },
  'tome': { lat: 38.6833, long: 141.2500, zoom: 12 },
  'kurihara': { lat: 38.7833, long: 140.9500, zoom: 12 },
  'higashimatsushima': { lat: 38.3833, long: 141.1667, zoom: 12 },
  'osaki': { lat: 38.5667, long: 140.9000, zoom: 12 },
  'tomiya': { lat: 38.3500, long: 140.8667, zoom: 12 },
  'zao': { lat: 38.1297, long: 140.5897, zoom: 12 },
  'shichikashuku': { lat: 38.0264, long: 140.3800, zoom: 12 },
  'ogawara': { lat: 38.0678, long: 140.7428, zoom: 12 },
  'murata': { lat: 38.1186, long: 140.7103, zoom: 12 },
  'shibata': { lat: 38.0833, long: 140.7667, zoom: 12 },
  'kawasaki': { lat: 38.2000, long: 140.5833, zoom: 12 }, // 宮城県川崎町
  'marumori': { lat: 37.9406, long: 140.7439, zoom: 12 },
  'watari': { lat: 38.0411, long: 140.8886, zoom: 12 },
  'yamamoto': { lat: 37.9256, long: 140.9233, zoom: 12 },
  'matsushima': { lat: 38.3683, long: 141.0569, zoom: 12 },
  'shichigahama': { lat: 38.2722, long: 141.0778, zoom: 12 },
  'rifu': { lat: 38.3306, long: 140.9806, zoom: 12 },
  'taiwa': { lat: 38.4500, long: 140.8833, zoom: 12 },
  'osato': { lat: 38.4667, long: 141.0000, zoom: 12 },
  'ohira': { lat: 38.4833, long: 140.9500, zoom: 12 },
  'shikama': { lat: 38.6500, long: 140.8333, zoom: 12 },
  'kami': { lat: 38.6000, long: 140.8000, zoom: 12 },
  'wakuya': { lat: 38.5667, long: 141.1333, zoom: 12 },
  'misato': { lat: 38.5167, long: 141.0833, zoom: 12 },
  'onagawa': { lat: 38.4358, long: 141.4886, zoom: 12 },
  'minamisanriku': { lat: 38.6833, long: 141.4500, zoom: 12 },
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
    
    const escape = (s: string) => s.replace(/[&<>"'`]/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;'} as any)[c]);

    const areaName = escape(areaList[String(pin.area_id)]?.area_name || '不明');
    marker.bindPopup(`
      <b>${areaName} ${escape(pin.name)}</b><br>
      ステータス: ${getStatusText(pin.status)}<br>
      備考: ${escape(getPinNote((pin as any).note))}<br>
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

    const escape = (s: string) => s.replace(/[&<>"'`]/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;'} as any)[c]);

    marker.bindPopup(`
      <b>期日前投票所: ${escape(pin.name)}</b><br>
      ${escape(pin.address)}<br>
      期間: ${escape(pin.period)}<br>
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
          latlong = [38.3732569073201, 140.85510802007664];
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
        const area = "miyagi"
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

    return () => {
      mapInstance.off('locationfound');
    };

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