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

async function loadBoardPins(
  pins: PinData[],
  layer: LayerGroup, // LayerGroup型を適用
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
    
    const areaName = pin.cities?.city || '不明';
    marker.bindPopup(`
      <b>${areaName} ${pin.number}</b><br>
      ステータス: ${getStatusText(pin.status)}<br>
      備考: ${getPinNote(pin.note)}<br>
      座標: <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a>
    `);
  });
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const layerControlRef = useRef<Control.Layers | null>(null); 
  const overlaysRef = useRef<{ [key: string]: LayerGroup }>({}); 
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const layersRef = useRef<LayerGroup[]>([]);
  const controlRef = useRef<L.Control.Layers | null>(null);

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
      await updatePin(selectedPin.id, currentStatus, noteText);
      alert('更新しました！');
      setSelectedPin(null);
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      alert('エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!mapInstance) return;

    layersRef.current.forEach((layer: LayerGroup) => { // 型(LayerGroup)を追加
      if (mapInstance.hasLayer(layer)) {
        mapInstance.removeLayer(layer);
      }
    });
    if (controlRef.current) {
      mapInstance.removeControl(controlRef.current);
    }

    const initializeMap = async () => {
      // --- ▼ クリーンアップ処理（ここから） ▼ ---
      // 前回の実行で追加した凡例（レイヤーコントロール）を削除
      if (layerControlRef.current) {
        mapInstance.removeControl(layerControlRef.current);
      }
      // 前回の実行で追加したピンのレイヤーを全て削除
      Object.values(overlaysRef.current).forEach(layer => {
        mapInstance.removeLayer(layer);
      });
      // --- ▲ クリーンアップ処理（ここまで） ▲ ---


      const L = (await import('leaflet')).default;
      
      // 新しいピンのレイヤーを作成し、refに記憶させる
      const newOverlays: { [key: string]: LayerGroup } = {
        '未': L.layerGroup(), '完了': L.layerGroup(), '異常': L.layerGroup(),
        '要確認': L.layerGroup(), '異常対応中': L.layerGroup(), '削除': L.layerGroup(),
      };
      overlaysRef.current = newOverlays;
      Object.values(overlaysRef.current).forEach(layer => layer.addTo(mapInstance));

      const baseLayers = createBaseLayers(L);
      
      // 初回表示時のみベースマップを追加する
      if (!mapInstance.hasLayer(baseLayers.japanBaseMap)) {
        baseLayers.japanBaseMap.addTo(mapInstance);
      }
      
      // 新しい凡例（レイヤーコントロール）を作成し、refに記憶させる
      const newControl = L.control.layers({
        'OpenStreetMap': baseLayers.osm, 'Google Map': baseLayers.googleMap,
        '国土地理院地図': baseLayers.japanBaseMap,
      }, overlaysRef.current).addTo(mapInstance);
      layerControlRef.current = newControl;


      // updateTriggerが初回（0）の時だけ視点を初期化する
      if (updateTrigger === 0) {
        const setInitialView = (pins: PinData[]) => {
          if (pins && pins.length > 0) {
            const latitudes = pins.map(p => p.lat).filter(lat => lat !== null) as number[];
            const longitudes = pins.map(p => p.long).filter(lng => lng !== null) as number[];
            if(latitudes.length > 0 && longitudes.length > 0) {
              const centerLat = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
              const centerLng = (Math.max(...longitudes) + Math.min(...longitudes)) / 2;
              mapInstance.setView([centerLat, centerLng], 12);
            } else {
              mapInstance.setView([35.681236, 139.767125], 11);
            }
          } else {
            mapInstance.setView([35.681236, 139.767125], 11);
          }
        };

        try {
        // データベースの更新が反映されるのを待つために、0.5秒だけ待機します。
        // ※初回ロード時は待機しないように、updateTrigger > 0 の条件を入れています。
        if (updateTrigger > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
          const pins = await getBoardPins(prefecture);
          setInitialView(pins);
        } catch (error) {
          console.error('Error setting initial view:', error);
        }
      }

      try {
        const pins = await getBoardPins(prefecture);

        // 新しいレイヤーに最新のピン情報を描画
        await loadBoardPins(pins, overlaysRef.current['削除'], L, setSelectedPin, 6);
        await loadBoardPins(pins, overlaysRef.current['完了'], L, setSelectedPin, 1);
        await loadBoardPins(pins, overlaysRef.current['異常'], L, setSelectedPin, 2);
        await loadBoardPins(pins, overlaysRef.current['要確認'], L, setSelectedPin, 4);
        await loadBoardPins(pins, overlaysRef.current['異常対応中'], L, setSelectedPin, 5);
        await loadBoardPins(pins, overlaysRef.current['未'], L, setSelectedPin, 0);

      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    initializeMap();

  }, [mapInstance, prefecture, updateTrigger]);

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
            {selectedPin.cities?.city} {selectedPin.number}
          </h3>
          <p><strong>ステータス:</strong> {getStatusText(currentStatus!)}</p>
          
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {/* ステータスが「未」(0) の場合、[完了]ボタンを表示 */}
            {selectedPin && selectedPin.status === 0 && (
              <button onClick={() => setCurrentStatus(1)}>完了</button>
            )}

            {/* ステータスが「完了」(1) の場合、[貼り付け確認完了]ボタンを表示 */}
            {selectedPin && selectedPin.status === 1 && (
              <button onClick={() => setCurrentStatus(7)}>貼り付け確認完了</button>
            )}

            {/* 最終ステータス(7)やその他の場合は、操作ボタンを何も表示しない */}
          </div>
          <div>
            <label htmlFor="problem-report" style={{ fontWeight: 'bold' }}>問題報告:</label>
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

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapPageContent />
    </Suspense>
  );
}
