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
  'nishi': { lat: 35.9080, long: 139.5880, zoom: 12 }, // さいたま市西区役所
  'kita': { lat: 35.9400, long: 139.6080, zoom: 12 }, // さいたま市北区役所
  'omiya': { lat: 35.9060, long: 139.6230, zoom: 12 }, // さいたま市大宮区役所
  'minuma': { lat: 35.9460, long: 139.6580, zoom: 12 }, // さいたま市見沼区役所
  'chuo': { lat: 35.8820, long: 139.6200, zoom: 12 }, // さいたま市中央区役所
  'sakura': { lat: 35.8700, long: 139.5900, zoom: 12 }, // さいたま市桜区役所
  'urawa': { lat: 35.8600, long: 139.6500, zoom: 12 }, // さいたま市浦和区役所
  'minami': { lat: 35.8450, long: 139.6480, zoom: 12 }, // さいたま市南区役所
  'midori': { lat: 35.8950, long: 139.6850, zoom: 12 }, // さいたま市緑区役所
  'iwatsuki': { lat: 35.9550, long: 139.6850, zoom: 12 }, // さいたま市岩槻区役所
  'kawagoe': { lat: 35.9180, long: 139.4850, zoom: 12 },
  'kumagaya': { lat: 36.1480, long: 139.3850, zoom: 12 },
  'kawaguchi ': { lat: 35.8050, long: 139.7200, zoom: 12 },
  'gyoda': { lat: 36.1300, long: 139.4600, zoom: 12 },
  'chichibu': { lat: 35.9900, long: 139.0800, zoom: 12 },
  'tokorozawa': { lat: 35.7860, long: 139.4680, zoom: 12 },
  'hanno': { lat: 35.8600, long: 139.3250, zoom: 12 },
  'kazo': { lat: 36.1100, long: 139.6100, zoom: 12 },
  'honjo': { lat: 36.2350, long: 139.1900, zoom: 12 },
  'higashimatsuyama': { lat: 36.0300, long: 139.4000, zoom: 12 },
  'kasukabe': { lat: 35.9800, long: 139.7500, zoom: 12 },
  'sayama': { lat: 35.8750, long: 139.4050, zoom: 12 },
  'hanyu': { lat: 36.1700, long: 139.5400, zoom: 12 },
  'konosu': { lat: 36.0500, long: 139.5000, zoom: 12 },
  'fukaya': { lat: 36.1950, long: 139.2950, zoom: 12 },
  'ageo': { lat: 35.9750, long: 139.5850, zoom: 12 },
  'soka': { lat: 35.8450, long: 139.8000, zoom: 12 },
  'koshigaya': { lat: 35.8900, long: 139.8000, zoom: 12 },
  'warabi': { lat: 35.8200, long: 139.6800, zoom: 12 },
  'toda': { lat: 35.8000, long: 139.6800, zoom: 12 },
  'iruma': { lat: 35.8150, long: 139.3800, zoom: 12 },
  'asaka': { lat: 35.8000, long: 139.5800, zoom: 12 },
  'shiki': { lat: 35.8150, long: 139.5700, zoom: 12 },
  'wako': { lat: 35.7800, long: 139.6100, zoom: 12 },
  'niiza': { lat: 35.7850, long: 139.5550, zoom: 12 },
  'okegawa': { lat: 36.0000, long: 139.5600, zoom: 12 },
  'kuki': { lat: 36.0600, long: 139.6700, zoom: 12 },
  'kitamoto': { lat: 36.0000, long: 139.5200, zoom: 12 },
  'yashio': { lat: 35.8600, long: 139.8500, zoom: 12 },
  'fujimi': { lat: 35.8750, long: 139.5300, zoom: 12 },
  'misato': { lat: 35.8700, long: 139.8800, zoom: 12 },
  'hasuda': { lat: 36.0100, long: 139.6500, zoom: 12 },
  'sakado': { lat: 35.9550, long: 139.3900, zoom: 12 },
  'satte': { lat: 36.0500, long: 139.7100, zoom: 12 },
  'tsurugashima': { lat: 35.9500, long: 139.3950, zoom: 12 },
  'hidaka': { lat: 35.9100, long: 139.3700, zoom: 12 },
  'yoshikawa': { lat: 35.8900, long: 139.8400, zoom: 12 },
  'fujimino': { lat: 35.8700, long: 139.5000, zoom: 12 },
  'shiraoka': { lat: 36.0200, long: 139.6900, zoom: 12 },
  'ina': { lat: 35.9800, long: 139.6000, zoom: 12 },
  'miyoshi': { lat: 35.8500, long: 139.5000, zoom: 12 },
  'moroyama': { lat: 35.9400, long: 139.3200, zoom: 12 },
  'ogose': { lat: 36.0000, long: 139.3200, zoom: 12 },
  'namegawa': { lat: 36.0300, long: 139.3600, zoom: 12 },
  'ranzan': { lat: 36.0300, long: 139.3100, zoom: 12 },
  'ogawa': { lat: 36.0500, long: 139.2000, zoom: 12 },
  'kawajima': { lat: 35.9800, long: 139.4500, zoom: 12 },
  'yoshimi': { lat: 36.0000, long: 139.4600, zoom: 12 },
  'hatoyama': { lat: 36.0000, long: 139.3600, zoom: 12 },
  'tokigawa': { lat: 36.0200, long: 139.2600, zoom: 12 },
  'yokoze': { lat: 35.9700, long: 139.0600, zoom: 12 },
  'minano': { lat: 36.0500, long: 139.1100, zoom: 12 },
  'nagatoro': { lat: 36.0800, long: 139.1200, zoom: 12 },
  'ogano': { lat: 36.0000, long: 138.9800, zoom: 12 },
  'higashichichibu': { lat: 36.0200, long: 139.1500, zoom: 12 },
  'misato_machi': { lat: 36.0700, long: 139.2000, zoom: 12 }, // 児玉郡美里町
  'kamikawa': { lat: 36.1400, long: 139.0600, zoom: 12 },
  'kamisato': { lat: 36.1900, long: 139.2000, zoom: 12 },
  'yorii': { lat: 36.0800, long: 139.1800, zoom: 12 },
  'miyashiro': { lat: 36.0200, long: 139.7300, zoom: 12 },
  'sugito': { lat: 36.0300, long: 139.7800, zoom: 12 },
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
          latlong = [36.00030429034826, 139.3468115089636];
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
        const area = "saitama"
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