// src/app/map/page.tsx のファイル全体を、この内容に置き換えてください

'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Map as LeafletMap, LayerGroup, Control } from 'leaflet';
import { getBoardPins, updatePin } from '@/lib/api';
import { getStatusText, getStatusColor, createBaseLayers } from '@/lib/map-utils';
import { PinData } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function getPinNote(note: string | null): string {
  return note || "なし";
}

// loadBoardPins関数は変更なし
async function loadBoardPins(
  pins: PinData[],
  layer: LayerGroup,
  L: any,
  setSelectedPin: (pin: PinData) => void,
  status: number | null = null
) {
  const filteredPins = status !== null ? pins.filter(item => item.status === status) : pins;

  filteredPins.forEach(pin => {
    if (pin.lat === null || pin.long === null) return;

    const marker = L.circleMarker([pin.lat, pin.long], {
      radius: 8,
      color: 'black',
      weight: 1,
      fillColor: getStatusColor(pin.status),
      fillOpacity: 0.9,
    }).addTo(layer);

    marker.on('click', () => {
      setSelectedPin(pin);
    });
    
    marker.bindPopup(`
      <b>${pin.place_name || '名称未設定'}</b><br>
      ${pin.cities?.city || '不明'} ${pin.number}<br>
      --------------------<br>
      ステータス: ${getStatusText(pin.status)}<br>
      備考: ${getPinNote(pin.note)}<br>
      座標: <a href="https://www.google.com/maps?q=${pin.lat},${pin.long}" target="_blank" rel="noopener noreferrer">Google Mapで開く</a>
    `);
  });
}

// MapPageContent コンポーネント
function MapPageContent() {
  const searchParams = useSearchParams();
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const layerControlRef = useRef<Control.Layers | null>(null);
  const overlaysRef = useRef<{ [key: string]: LayerGroup }>({});

  const [pins, setPins] = useState<PinData[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const prefecture = searchParams.get('prefecture');

  useEffect(() => {
    if (selectedPin) {
      setCurrentStatus(selectedPin.status);
      setNoteText(selectedPin.note || '');
    }
  }, [selectedPin]);

  const handleSubmit = async () => {
    if (!selectedPin || currentStatus === null) return;
    setIsSubmitting(true);

    try {
      const optimisticUpdatedPin: PinData = {
        ...selectedPin,
        status: currentStatus,
        note: noteText,
      };

      setPins(currentPins =>
        currentPins.map(p => (p.id === optimisticUpdatedPin.id ? optimisticUpdatedPin : p))
      );
      
      setSelectedPin(null);

      await updatePin(selectedPin.id, currentStatus, noteText);
    } catch (error) {
      alert('エラーが発生しました。データが正しく保存されていない可能性があります。ページを更新します。');
      window.location.reload(); 
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!prefecture) return;
    getBoardPins(prefecture).then(fetchedPins => {
      setPins(fetchedPins);
    });
  }, [prefecture]);

  useEffect(() => {
    if (!mapInstance) return;

    const drawMap = async () => {
      if (pins.length === 0 && prefecture) {
        return;
      }

      const L = (await import('leaflet')).default;

      if (layerControlRef.current) {
        mapInstance.removeControl(layerControlRef.current);
      }
      Object.values(overlaysRef.current).forEach(layer => {
        if (mapInstance.hasLayer(layer)) {
          mapInstance.removeLayer(layer);
        }
      });

      const newOverlays: { [key: string]: LayerGroup } = {
        '未': L.layerGroup(),
        '完了': L.layerGroup(),
        '貼り付け確認完了': L.layerGroup(),
        '異常': L.layerGroup(),
        '要確認': L.layerGroup(),
        '異常対応中': L.layerGroup(),
        '削除': L.layerGroup(),
      };
      overlaysRef.current = newOverlays;
      Object.values(overlaysRef.current).forEach(layer => layer.addTo(mapInstance));

      const baseLayers = createBaseLayers(L);
      if (!mapInstance.hasLayer(baseLayers.japanBaseMap)) {
        baseLayers.japanBaseMap.addTo(mapInstance);
      }
      
      const newControl = L.control.layers({
        'OpenStreetMap': baseLayers.osm, 'Google Map': baseLayers.googleMap,
        '国土地理院地図': baseLayers.japanBaseMap,
      }, overlaysRef.current).addTo(mapInstance);
      layerControlRef.current = newControl;

      if (mapInstance.getZoom() === undefined) {
        const latitudes = pins.map(p => p.lat).filter((lat): lat is number => lat !== null);
        const longitudes = pins.map(p => p.long).filter((lng): lng is number => lng !== null);
        if (latitudes.length > 0 && longitudes.length > 0) {
            const centerLat = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
            const centerLng = (Math.max(...longitudes) + Math.min(...longitudes)) / 2;
            mapInstance.setView([centerLat, centerLng], 12);
        } else {
            mapInstance.setView([35.681236, 139.767125], 11);
        }
      }

      await loadBoardPins(pins, overlaysRef.current['未'], L, setSelectedPin, 0);
      await loadBoardPins(pins, overlaysRef.current['完了'], L, setSelectedPin, 1);
      await loadBoardPins(pins, overlaysRef.current['貼り付け確認完了'], L, setSelectedPin, 7);
      await loadBoardPins(pins, overlaysRef.current['異常'], L, setSelectedPin, 2);
      await loadBoardPins(pins, overlaysRef.current['要確認'], L, setSelectedPin, 4);
      await loadBoardPins(pins, overlaysRef.current['異常対応中'], L, setSelectedPin, 5);
      await loadBoardPins(pins, overlaysRef.current['削除'], L, setSelectedPin, 6);
    };

    drawMap();

  }, [mapInstance, pins, prefecture]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Map onMapReady={setMapInstance} />
      {selectedPin && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.95)',
          padding: '15px', zIndex: 1000, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          width: '300px', fontFamily: 'sans-serif', backdropFilter: 'blur(5px)',
        }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            {selectedPin.place_name || '名称未設定'}
          </h3>
          <p><strong>ステータス:</strong> {getStatusText(currentStatus ?? selectedPin.status)}</p>
          
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {selectedPin.status === 0 && (
              <button onClick={() => setCurrentStatus(1)}>完了</button>
            )}
            {selectedPin.status === 1 && (
              <button onClick={() => setCurrentStatus(7)}>貼り付け確認完了</button>
            )}
          </div>
          
          <div>
            <label htmlFor="problem-report" style={{ fontWeight: 'bold' }}>備考:</label>
            <textarea
              id="problem-report"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px', marginTop: '5px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="例：ポスターが剥がれている"
            />
            <button onClick={handleSubmit} style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={isSubmitting}>
              {isSubmitting ? '送信中...' : '更新を送信'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// MapPageコンポーネント
export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapPageContent />
    </Suspense>
  );
}