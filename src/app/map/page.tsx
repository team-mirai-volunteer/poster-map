'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Map as LeafletMap, LayerGroup, Control } from 'leaflet';
import { getBoardPins, updatePin } from '@/lib/api';
import { getStatusText, getStatusColor, createBaseLayers } from '@/lib/map-utils';
import { PinData } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

//【重要】これらのヘルパー関数は、コンポーネントの外側で定義します
function getPinNote(note: string | null): string {
  return note || "なし";
}

async function loadBoardPins(
  pins: PinData[],
  layer: LayerGroup,
  L: any,
  setSelectedPin: (pin: PinData) => void,
  status: number | null = null
) {
  layer.clearLayers();
  const filteredPins = status !== null ? pins.filter(item => item.status === status) : pins;

  filteredPins.forEach(pin => {
    if (pin.lat === null || pin.long === null) return;
    const marker = L.circleMarker([pin.lat, pin.long], {
      radius: 8, weight: 0,
      fillColor: getStatusColor(pin.status), fillOpacity: 0.9,
    }).addTo(layer);

    marker.on('click', () => { setSelectedPin(pin); });
    marker.bindPopup(`
      <div style="font-size: 14px; line-height: 1.6;">
        <b>${pin.place_name || '名称未設定'}</b><br><hr style="margin: 4px 0;">
        <strong>住所:</strong> ${pin.address}<br>
        <strong>掲示板番号:</strong> ${pin.number}<br>
        <strong>ステータス:</strong> ${getStatusText(pin.status)}<br>
        <strong>備考:</strong> ${getPinNote(pin.note)}<br>
        <a href="https://www.google.com/maps?q=${pin.lat},${pin.long}" target="_blank" rel="noopener noreferrer">Google Mapで開く</a>
      </div>
    `);
  });
}

// ここからがReactコンポーネントの定義
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

  const handleSubmit = async () => { /* ... (省略) ... */ };

  useEffect(() => {
    if (!prefecture) return;
    getBoardPins(prefecture).then(fetchedPins => {
      setPins(fetchedPins);
    });
  }, [prefecture]);

  useEffect(() => {
    if (!mapInstance) return;

    // 地図の初期視点を、常に東京駅に固定する
    if (mapInstance.getZoom() === undefined) {
      mapInstance.setView([35.681236, 139.767125], 11);
    }

    const drawPins = async () => {
      if (pins.length === 0 && prefecture) { return; }

      const L = (await import('leaflet')).default;

      // ピンの再描画処理
      if (layerControlRef.current) mapInstance.removeControl(layerControlRef.current);
      Object.values(overlaysRef.current).forEach(layer => { if (mapInstance.hasLayer(layer)) mapInstance.removeLayer(layer); });

      const newOverlays = {
        '未': L.layerGroup(), '完了': L.layerGroup(), '貼り付け確認完了': L.layerGroup(),
        '異常': L.layerGroup(), '要確認': L.layerGroup(), '異常対応中': L.layerGroup(), '削除': L.layerGroup(),
      };
      overlaysRef.current = newOverlays;
      Object.values(overlaysRef.current).forEach(layer => layer.addTo(mapInstance));

      const baseLayers = createBaseLayers(L);
      const newControl = L.control.layers({
        'OpenStreetMap': baseLayers.osm, 'Google Map': baseLayers.googleMap, '国土地理院地図': baseLayers.japanBaseMap,
      }, overlaysRef.current).addTo(mapInstance);
      layerControlRef.current = newControl;

      await loadBoardPins(pins, overlaysRef.current['未'], L, setSelectedPin, 0);
      // ... (他のステータスのピン描画も同様) ...
    };

    drawPins();

  }, [mapInstance, pins]); // pinsデータが変更されたら、ピンの再描画だけを行う

  const statusButtons = [ /* ... */ ];

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Map onMapReady={setMapInstance} />

      {selectedPin && (
        <div style={{ /* ... UIパネルのスタイル ... */ }}>
          {/* ... (UIパネルの中身) ... */}
        </div>
      )}
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