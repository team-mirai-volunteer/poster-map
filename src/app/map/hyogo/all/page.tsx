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
  'kobe': { lat: 34.6901, long: 135.1955, zoom: 12 },
  'himeji': { lat: 34.8143, long: 134.6908, zoom: 12 },
  'amagasaki': { lat: 34.7336, long: 135.4053, zoom: 12 },
  'akashi': { lat: 34.6468, long: 135.0003, zoom: 12 },
  'nishinomiya': { lat: 34.7431, long: 135.3375, zoom: 12 },
  'sumoto': { lat: 34.3315, long: 134.8967, zoom: 12 },
  'ashiya': { lat: 34.7303, long: 135.3094, zoom: 12 },
  'itami': { lat: 34.7831, long: 135.4194, zoom: 12 },
  'aioi': { lat: 34.7936, long: 134.4678, zoom: 12 },
  'toyooka': { lat: 35.5458, long: 134.6853, zoom: 12 },
  'kakogawa': { lat: 34.7672, long: 134.8464, zoom: 12 },
  'ako': { lat: 34.7450, long: 134.3978, zoom: 12 },
  'nishiwaki': { lat: 35.0000, long: 134.9833, zoom: 12 },
  'takarazuka': { lat: 34.8083, long: 135.3625, zoom: 12 },
  'miki': { lat: 34.7944, long: 134.9961, zoom: 12 },
  'takasago': { lat: 34.7578, long: 134.7572, zoom: 12 },
  'kawanishi': { lat: 34.8608, long: 135.4189, zoom: 12 },
  'ono': { lat: 34.9547, long: 134.9556, zoom: 12 },
  'sanda': { lat: 34.9083, long: 135.2272, zoom: 12 },
  'kasai': { lat: 34.9397, long: 134.8517, zoom: 12 },
  'tambasasayama': { lat: 35.0833, long: 135.2167, zoom: 12 },
  'yabu': { lat: 35.3994, long: 134.7858, zoom: 12 },
  'tamba': { lat: 35.1333, long: 135.0333, zoom: 12 },
  'minamiawaji': { lat: 34.2250, long: 134.7444, zoom: 12 },
  'asago': { lat: 35.2000, long: 134.8333, zoom: 12 },
  'awaji': { lat: 34.4500, long: 134.9333, zoom: 12 },
  'shiso': { lat: 35.0667, long: 134.5500, zoom: 12 },
  'kato': { lat: 34.9333, long: 135.0333, zoom: 12 },
  'tatsuno': { lat: 34.8703, long: 134.5367, zoom: 12 },
  'inagawa': { lat: 34.9000, long: 135.3833, zoom: 12 },
  'taka': { lat: 35.0667, long: 134.9167, zoom: 12 },
  'inami': { lat: 34.7431, long: 134.7981, zoom: 12 },
  'harima': { lat: 34.7267, long: 134.8328, zoom: 12 },
  'ichikawa': { lat: 35.0333, long: 134.8000, zoom: 12 },
  'fukusaki': { lat: 34.9333, long: 134.7500, zoom: 12 },
  'kamikawa': { lat: 35.1000, long: 134.8500, zoom: 12 },
  'taishi': { lat: 34.8458, long: 134.5772, zoom: 12 },
  'kamigori': { lat: 34.8833, long: 134.4167, zoom: 12 },
  'sayo': { lat: 35.0000, long: 134.3333, zoom: 12 },
  'kami': { lat: 35.5333, long: 134.5833, zoom: 12 },
  'shinonsen': { lat: 35.6000, long: 134.5500, zoom: 12 },
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
          latlong = [35.102136871207165, 134.82193301286011];
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
        const area = "hyogo"
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