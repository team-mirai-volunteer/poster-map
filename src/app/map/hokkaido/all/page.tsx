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
  'sapporo': { lat: 43.0641, long: 141.3469, zoom: 12 },
  'hakodate': { lat: 41.7687, long: 140.7289, zoom: 12 },
  'otaru': { lat: 43.1975, long: 140.9944, zoom: 12 },
  'asahikawa': { lat: 43.7667, long: 142.3667, zoom: 12 },
  'muroran': { lat: 42.3167, long: 140.9833, zoom: 12 },
  'kushiro': { lat: 42.9833, long: 144.3833, zoom: 12 },
  'obihiro': { lat: 42.9167, long: 143.2000, zoom: 12 },
  'kitami': { lat: 43.8000, long: 143.9000, zoom: 12 },
  'yubari': { lat: 43.0500, long: 142.0167, zoom: 12 },
  'iwamizawa': { lat: 43.2000, long: 141.7667, zoom: 12 },
  'abashiri': { lat: 44.0219, long: 144.2731, zoom: 12 },
  'rumoi': { lat: 43.9589, long: 141.6575, zoom: 12 },
  'tomakomai': { lat: 42.6333, long: 141.6000, zoom: 12 },
  'wakkanai': { lat: 45.4167, long: 141.6667, zoom: 12 },
  'bibai': { lat: 43.3167, long: 141.8667, zoom: 12 },
  'ashibetsu': { lat: 43.5167, long: 142.2000, zoom: 12 },
  'ebetsu': { lat: 43.1000, long: 141.5500, zoom: 12 },
  'akabira': { lat: 43.5667, long: 142.0500, zoom: 12 },
  'monbetsu': { lat: 44.3500, long: 143.5667, zoom: 12 },
  'shibetsu': { lat: 44.3500, long: 141.9167, zoom: 12 },
  'nayoro': { lat: 44.3500, long: 142.4667, zoom: 12 },
  'mikasa': { lat: 43.2167, long: 141.7833, zoom: 12 },
  'nemuro': { lat: 43.3581, long: 145.5861, zoom: 12 },
  'chitose': { lat: 42.8167, long: 141.6500, zoom: 12 },
  'takikawa': { lat: 43.5500, long: 141.9167, zoom: 12 },
  'sunagawa': { lat: 43.4833, long: 141.9167, zoom: 12 },
  'utashinai': { lat: 43.5167, long: 142.0167, zoom: 12 },
  'fukagawa': { lat: 43.7167, long: 142.0500, zoom: 12 },
  'furano': { lat: 43.3333, long: 142.4000, zoom: 12 },
  'noboribetsu': { lat: 42.4167, long: 141.1500, zoom: 12 },
  'eniwa': { lat: 42.8833, long: 141.5667, zoom: 12 },
  'date': { lat: 42.4833, long: 140.8500, zoom: 12 },
  'kitahiroshima': { lat: 43.0000, long: 141.5667, zoom: 12 },
  'ishikari': { lat: 43.2333, long: 141.3500, zoom: 12 },
  'hokuto': { lat: 41.8333, long: 140.6500, zoom: 12 },
  'tobetsu': { lat: 43.2833, long: 141.5167, zoom: 12 },
  'shinshinotsu': { lat: 43.2000, long: 141.6500, zoom: 12 },
  'matsumae': { lat: 41.4333, long: 140.1167, zoom: 12 },
  'fukushima': { lat: 41.4833, long: 140.2167, zoom: 12 },
  'shiriuchi': { lat: 41.6000, long: 140.3667, zoom: 12 },
  'kikonai': { lat: 41.6500, long: 140.4333, zoom: 12 },
  'nanae': { lat: 41.8833, long: 140.6667, zoom: 12 },
  'shikabe': { lat: 42.1333, long: 140.7833, zoom: 12 },
  'mori': { lat: 42.1167, long: 140.5833, zoom: 12 },
  'yakumo': { lat: 42.1667, long: 140.2500, zoom: 12 },
  'oshamambe': { lat: 42.3333, long: 140.3667, zoom: 12 },
  'esashi': { lat: 41.8833, long: 140.1333, zoom: 12 },
  'kaminokuni': { lat: 41.7667, long: 140.1000, zoom: 12 },
  'assabu': { lat: 41.9500, long: 140.0833, zoom: 12 },
  'otobe': { lat: 42.0667, long: 140.0000, zoom: 12 },
  'okushiri': { lat: 42.1333, long: 139.5333, zoom: 12 },
  'imakane': { lat: 42.2667, long: 140.1000, zoom: 12 },
  'setana': { lat: 42.3833, long: 140.1000, zoom: 12 },
  'shimamaki': { lat: 42.6000, long: 140.1500, zoom: 12 },
  'sutsu': { lat: 42.9000, long: 140.2333, zoom: 12 },
  'kuromatsunai': { lat: 42.7500, long: 140.3667, zoom: 12 },
  'rankoshi': { lat: 42.8667, long: 140.5500, zoom: 12 },
  'niseko': { lat: 42.9000, long: 140.6833, zoom: 12 },
  'makkari': { lat: 42.8500, long: 140.8500, zoom: 12 },
  'rusutsu': { lat: 42.7333, long: 140.9000, zoom: 12 },
  'kimobetsu': { lat: 42.8000, long: 140.8500, zoom: 12 },
  'kyogoku': { lat: 42.8500, long: 140.8000, zoom: 12 },
  'kutchan': { lat: 42.9000, long: 140.7500, zoom: 12 },
  'kyowa': { lat: 43.0667, long: 140.6333, zoom: 12 },
  'iwanai': { lat: 42.9833, long: 140.5000, zoom: 12 },
  'tomari': { lat: 43.1000, long: 140.5000, zoom: 12 },
  'kamoenai': { lat: 43.2000, long: 140.3500, zoom: 12 },
  'shakotan': { lat: 43.2833, long: 140.4667, zoom: 12 },
  'furubira': { lat: 43.2667, long: 140.6000, zoom: 12 },
  'niki': { lat: 43.2167, long: 140.8000, zoom: 12 },
  'yoichi': { lat: 43.2000, long: 140.8500, zoom: 12 },
  'akaigawa': { lat: 43.1000, long: 140.8500, zoom: 12 },
  'nanporo': { lat: 43.1167, long: 141.7667, zoom: 12 },
  'naie': { lat: 43.3833, long: 141.8667, zoom: 12 },
  'kamisunagawa': { lat: 43.4333, long: 141.9833, zoom: 12 },
  'yuni': { lat: 42.9833, long: 141.7833, zoom: 12 },
  'naganuma': { lat: 43.0500, long: 141.6833, zoom: 12 },
  'kuriyama': { lat: 43.0667, long: 141.7833, zoom: 12 },
  'tsukigata': { lat: 43.3000, long: 141.7167, zoom: 12 },
  'urausu': { lat: 43.3833, long: 141.6333, zoom: 12 },
  'shintotsukawa': { lat: 43.5167, long: 141.8667, zoom: 12 },
  'moshiushi': { lat: 43.6167, long: 141.8333, zoom: 12 },
  'chippubetsu': { lat: 43.6833, long: 141.8500, zoom: 12 },
  'uryu': { lat: 43.7000, long: 141.8500, zoom: 12 },
  'hokuryu': { lat: 43.7667, long: 141.9500, zoom: 12 },
  'numata': { lat: 43.8333, long: 141.9000, zoom: 12 },
  'takasu': { lat: 43.8000, long: 142.4500, zoom: 12 },
  'higashikagura': { lat: 43.7000, long: 142.4500, zoom: 12 },
  'toma': { lat: 43.8000, long: 142.5500, zoom: 12 },
  'pippu': { lat: 43.8500, long: 142.5333, zoom: 12 },
  'aibetsu': { lat: 43.8500, long: 142.6333, zoom: 12 },
  'kamikawa': { lat: 43.9000, long: 142.7833, zoom: 12 },
  'higashikawa': { lat: 43.7000, long: 142.6000, zoom: 12 },
  'biei': { lat: 43.5667, long: 142.4833, zoom: 12 },
  'kamifurano': { lat: 43.4667, long: 142.4833, zoom: 12 },
  'nakafurano': { lat: 43.4000, long: 142.4333, zoom: 12 },
  'minamifurano': { lat: 43.1500, long: 142.4500, zoom: 12 },
  'shimukappu': { lat: 42.9833, long: 142.4000, zoom: 12 },
  'wassamu': { lat: 44.0667, long: 142.2500, zoom: 12 },
  'kenbuchi': { lat: 44.1833, long: 142.3000, zoom: 12 },
  'shimokawa': { lat: 44.3333, long: 142.5000, zoom: 12 },
  'bifuka': { lat: 44.4833, long: 142.3667, zoom: 12 },
  'otoineppu': { lat: 44.8000, long: 142.2000, zoom: 12 },
  'nakagawa': { lat: 44.9000, long: 142.1500, zoom: 12 },
  'horokanai': { lat: 44.0667, long: 142.1000, zoom: 12 },
  'mashike': { lat: 43.8500, long: 141.4833, zoom: 12 },
  'obira': { lat: 44.0500, long: 141.6000, zoom: 12 },
  'tomamae': { lat: 44.3000, long: 141.6833, zoom: 12 },
  'haboro': { lat: 44.3500, long: 141.7167, zoom: 12 },
  'shosanbetsu': { lat: 44.5833, long: 141.7333, zoom: 12 },
  'enbetsu': { lat: 44.6833, long: 141.7833, zoom: 12 },
  'teshio': { lat: 44.9000, long: 141.7500, zoom: 12 },
  'sarufutsu': { lat: 45.3000, long: 142.0667, zoom: 12 },
  'hamatonbetsu': { lat: 45.0667, long: 142.4500, zoom: 12 },
  'nakatonbetsu': { lat: 44.9000, long: 142.3500, zoom: 12 },
  'esashi-cho': { lat: 44.9333, long: 142.5833, zoom: 12 }, // 枝幸町
  'toyotomi': { lat: 45.1000, long: 141.7833, zoom: 12 },
  'rebun': { lat: 45.2000, long: 141.0500, zoom: 12 },
  'rishiri': { lat: 45.1667, long: 141.1667, zoom: 12 },
  'rishirifuji': { lat: 45.2833, long: 141.2000, zoom: 12 },
  'horonobe': { lat: 44.9667, long: 141.8333, zoom: 12 },
  'bihoro': { lat: 43.8333, long: 144.1000, zoom: 12 },
  'tsubetsu': { lat: 43.7667, long: 144.1500, zoom: 12 },
  'shari': { lat: 43.9000, long: 144.6667, zoom: 12 },
  'kiyosato': { lat: 43.9167, long: 144.6000, zoom: 12 },
  'koshimizu': { lat: 43.8667, long: 144.4500, zoom: 12 },
  'kunneppu': { lat: 43.8333, long: 143.6833, zoom: 12 },
  'oketo': { lat: 43.7667, long: 143.5000, zoom: 12 },
  'saroma': { lat: 44.0500, long: 143.8500, zoom: 12 },
  'engaru': { lat: 44.0500, long: 143.5333, zoom: 12 },
  'yubetsu': { lat: 44.1833, long: 143.6000, zoom: 12 },
  'takinoue': { lat: 44.1500, long: 143.1000, zoom: 12 },
  'okoppe': { lat: 44.3833, long: 143.1333, zoom: 12 },
  'nishiokoppe': { lat: 44.2500, long: 142.9833, zoom: 12 },
  'omu': { lat: 44.4000, long: 142.8500, zoom: 12 },
  'ozora': { lat: 43.9000, long: 144.1667, zoom: 12 },
  'toyoura': { lat: 42.6333, long: 140.6000, zoom: 12 },
  'sobetu': { lat: 42.5667, long: 140.8000, zoom: 12 },
  'shiraoi': { lat: 42.5833, long: 141.3333, zoom: 12 },
  'atsuma': { lat: 42.8500, long: 141.8500, zoom: 12 },
  'toyako': { lat: 42.5500, long: 140.8500, zoom: 12 },
  'abira': { lat: 42.8667, long: 141.8500, zoom: 12 },
  'mukawa': { lat: 42.6500, long: 141.9833, zoom: 12 },
  'hidaka': { lat: 42.5167, long: 142.0833, zoom: 12 },
  'biratori': { lat: 42.7000, long: 142.1667, zoom: 12 },
  'niikappu': { lat: 42.4500, long: 142.3667, zoom: 12 },
  'urakawa': { lat: 42.1667, long: 142.7833, zoom: 12 },
  'samani': { lat: 41.9167, long: 143.0167, zoom: 12 },
  'erimo': { lat: 41.9500, long: 143.2000, zoom: 12 },
  'shinhidaka': { lat: 42.3333, long: 142.5667, zoom: 12 },
  'otofuke': { lat: 42.9500, long: 143.2500, zoom: 12 },
  'shihoro': { lat: 43.1667, long: 143.4000, zoom: 12 },
  'kamishihoro': { lat: 43.3000, long: 143.3500, zoom: 12 },
  'shikaoi': { lat: 43.1000, long: 143.0833, zoom: 12 },
  'shintoku': { lat: 43.0833, long: 142.8333, zoom: 12 },
  'shimizu': { lat: 42.9333, long: 142.9000, zoom: 12 },
  'memuro': { lat: 42.9000, long: 142.9833, zoom: 12 },
  'nakasatsunai': { lat: 42.7500, long: 143.0500, zoom: 12 },
  'sarabetsu': { lat: 42.7000, long: 143.1667, zoom: 12 },
  'taiki': { lat: 42.4500, long: 143.2000, zoom: 12 },
  'hiroo': { lat: 42.2833, long: 143.3000, zoom: 12 },
  'makubetsu': { lat: 42.8667, long: 143.4000, zoom: 12 },
  'ikeda': { lat: 42.8833, long: 143.4833, zoom: 12 },
  'toyokoro': { lat: 42.8000, long: 143.6000, zoom: 12 },
  'honbetsu': { lat: 43.0667, long: 143.6833, zoom: 12 },
  'ashoro': { lat: 43.3000, long: 143.7833, zoom: 12 },
  'rikubetsu': { lat: 43.4667, long: 143.8167, zoom: 12 },
  'urahoro': { lat: 42.8000, long: 143.8000, zoom: 12 },
  'kushiro-cho': { lat: 42.9667, long: 144.4000, zoom: 12 },
  'akkeshi': { lat: 43.0333, long: 144.8000, zoom: 12 },
  'hamanaka': { lat: 43.1000, long: 145.0333, zoom: 12 },
  'shibecha': { lat: 43.2833, long: 144.6000, zoom: 12 },
  'teshikaga': { lat: 43.4500, long: 144.4500, zoom: 12 },
  'tsurui': { lat: 43.0500, long: 144.1833, zoom: 12 },
  'shiranuka': { lat: 42.9500, long: 144.0500, zoom: 12 },
  'betsukai': { lat: 43.3500, long: 145.0667, zoom: 12 },
  'nakashibetsu': { lat: 43.5500, long: 144.9500, zoom: 12 },
  'shibetsu-cho': { lat: 43.6500, long: 145.0000, zoom: 12 }, // 標津町
  'rausu': { lat: 44.0667, long: 145.3333, zoom: 12 },
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
          latlong = [43.5707439350071, 142.9919888725808];
          zoom = 7;
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
        const area = "hokkaido"
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