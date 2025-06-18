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
  'yokohama': { lat: 35.458765291353174, long: 139.5785681176657, zoom: 12 },
  'kawasaki': { lat: 35.572383235182535, long: 139.63890485063573, zoom: 12 },
  'sagamihara': { lat: 35.573020943967414, long: 139.24992491236742, zoom: 11 },
  'yokosuka': { lat: 35.2556176083299, long: 139.66085166010924, zoom: 11 },
  'hiratuka': { lat: 35.34893822686819, long: 139.31837100263354, zoom: 11 },
  'kamakura': { lat: 35.33110310119594, long: 139.53754483566715, zoom: 11 },
  'fujisawa': { lat: 35.37286392201757, long: 139.46138374673396, zoom: 11 },
  'odawara': { lat: 35.265065977641946, long: 139.14949737807717, zoom: 11 },
  'chigasaki': { lat: 35.34365558260598, long: 139.41084879755454, zoom: 11 },
  'zushi': { lat: 35.30153449832982, long: 139.59355668223782, zoom: 11 },
  'miura': { lat: 35.173047269953585, long: 139.63978329528868, zoom: 11 },
  'hadano': { lat: 35.398812257920994, long: 139.20055509275159, zoom: 11 },
  'atugi': { lat: 35.45724253389189, long: 139.33035926574942, zoom: 11 },
  'yamato': { lat: 35.47519185894194, long: 139.45751962382272, zoom: 11 },
  'isehara': { lat: 35.41007180179284, long: 139.29459620941853, zoom: 11 },
  'ebina': { lat: 35.436620394111465, long: 139.39146026362496, zoom: 11 },
  'zama': { lat: 35.48684618832795, long: 139.40916118146927, zoom: 11 },
  'minamiashigara': { lat: 35.31242419760426, long: 139.0716030128951, zoom: 11 },
  'ayase': { lat: 35.44229587829687, long: 139.43010980286155, zoom: 11 },
  'hayama': { lat: 35.272777956891126, long: 139.59704685325, zoom: 11 },
  'samukawa': { lat: 35.375524047778875, long: 139.38761265262534, zoom: 11 },
  'oiso': { lat: 35.31813243027616, long: 139.29301448568265, zoom: 11 },
  'ninomiya': { lat: 35.30859778029417, long: 139.2503352000891, zoom: 11 },
  'nakai': { lat: 35.33483103126903, long: 139.21646596260638, zoom: 11 },
  'ohi': { lat: 35.334891989961456, long: 139.1644070739844, zoom: 11 },
  'matuda': { lat: 35.392258747309064, long: 139.13271419775685, zoom: 11 },
  'yamakita': { lat: 35.420736326318234, long: 139.0454419582406, zoom: 11 },
  'kaisei': { lat: 35.334520604820284, long: 139.12434780206394, zoom: 11 },
  'hakone': { lat: 35.23488978295798, long: 139.0325028035721, zoom: 11 },
  'manazuru': { lat: 35.150309106867454, long: 139.14194007907903, zoom: 11 },
  'yugawara': { lat: 35.16754621728119, long: 139.08062225903697, zoom: 11 },
  'aikawa': { lat: 35.53039573349763, long: 139.30104681068894, zoom: 11 },
  'kiyokawa': { lat: 35.48520833893809, long: 139.23056530798374, zoom: 11 },
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
          latlong = [35.449537633014714, 139.36061420423283];
          zoom = 11;
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
        const area = "kanagawa"
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
        await loadVoteVenuePins(overlays['期日前投票所'], L, area);

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

export default function KanagawaMapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapPageContent />
    </Suspense>
  );
}