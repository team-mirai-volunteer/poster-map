'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function PostingPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!mapInstance) return;

    const initializePostingMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Set initial view to Tokyo
      mapInstance.setView([35.6762, 139.6503], 10);

      // Add base layer
      const tileLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
      }).addTo(mapInstance);

      // TODO: Add line drawing functionality here
    };

    initializePostingMap();
  }, [mapInstance]);

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
          position: relative;
        }
        .edit-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .edit-button {
          padding: 8px 16px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .edit-button.active {
          background-color: #007bff;
          color: white;
        }
        .edit-button:not(.active) {
          background-color: #f8f9fa;
          color: #333;
          border: 1px solid #ddd;
        }
        .edit-button:hover {
          opacity: 0.8;
        }
        .edit-status {
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      `}</style>
      
      <div className="edit-controls">
        <button 
          className={`edit-button ${isEditing ? 'active' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Stop Editing' : 'Draw Line'}
        </button>
        {isEditing && (
          <div className="edit-status">Editing</div>
        )}
      </div>
      
      <Map onMapReady={setMapInstance} />
    </>
  );
}