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
  'sapporo': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hakodate': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'otaru': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'asahikawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'muroran': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kushiro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'obihiro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kitami': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'yubari': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'iwamizawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'abashiri': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rumoi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tomakomai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'wakkanai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'bibai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ashibetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ebetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'akabira': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'monbetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shibetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nayoro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'mikasa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nemuro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'chitose': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'takikawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'sunagawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'utashinai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'fukagawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'furano': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'noboribetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'eniwa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'date': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kitahiroshima': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ishikari': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hokuto': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tobetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shinshinotsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'matsumae': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'fukushima': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shiriuchi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kikonai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nanae': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shikabe': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'mori': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'yakumo': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'oshamambe': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'esashi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kaminokuni': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'assabu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'otobe': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'okushiri': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'imakane': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'setana': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shimamaki': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'sutsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kuromatsunai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rankoshi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'niseko': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'makkari': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rusutsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kimobetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kyogoku': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kutchan': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kyowa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'iwanai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tomari': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kamoenai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shakotan': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'furubira': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'niki': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'yoichi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'akaigawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nanporo': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'naie': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kamisunagawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'yuni': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'naganuma': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kuriyama': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tsukigata': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'urausu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shintotsukawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'moshiushi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'chippubetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'uryu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hokuryu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'numata': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'takasu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'higashikagura': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'toma': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'pippu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'aibetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kamikawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'higashikawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'biei': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kamifurano': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nakafurano': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'minamifurano': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shimukappu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'wassamu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kenbuchi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shimokawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'bifuka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'otoineppu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nakagawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'horokanai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'mashike': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'obira': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tomamae': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'haboro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shosanbetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'enbetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'teshio': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'sarufutsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hamatonbetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nakatonbetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'esashi-cho': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'toyotomi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rebun': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rishiri': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rishirifuji': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'horonobe': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'bihoro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tsubetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shari': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kiyosato': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'koshimizu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kunneppu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'oketo': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'saroma': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'engaru': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'yubetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'takinoue': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'okoppe': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nishiokoppe': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'omu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ozora': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'toyoura': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'sobetu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shiraoi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'atsuma': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'toyako': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'abira': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'mukawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hidaka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'biratori': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'niikappu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'urakawa': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'samani': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'erimo': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shinhidaka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'otofuke': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shihoro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kamishihoro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shikaoi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shintoku': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shimizu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'memuro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nakasatsunai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'sarabetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'taiki': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hiroo': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'makubetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ikeda': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'toyokoro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'honbetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'ashoro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rikubetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'urahoro': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'kushiro-cho': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'akkeshi': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'hamanaka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shibecha': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'teshikaga': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'tsurui': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shiranuka': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'betsukai': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'nakashibetsu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'shibetsu-cho': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
  'rausu': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
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
          latlong = [43.536262259143726, 143.30922908362015];
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