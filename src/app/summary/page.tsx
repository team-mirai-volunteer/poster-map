'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getAreaList, getProgress, getProgressCountdown } from '@/lib/api';
import { createProgressBox, createProgressBoxCountdown } from '@/lib/map-utils';
import { AreaList, ProgressData } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function getProgressColor(percentage: number): string {
  const colorStops = [
    { pct: 0.0, color: { r: 254, g: 237, b: 222 } },
    { pct: 0.25, color: { r: 253, g: 190, b: 133 } },
    { pct: 0.5, color: { r: 253, g: 141, b: 60 } },
    { pct: 0.75, color: { r: 230, g: 85, b: 13 } },
    { pct: 0.999, color: { r: 166, g: 54, b: 3 } },
    { pct: 1.0, color: { r: 150, g: 0, b: 73 } }
  ];

  percentage = Math.max(0, Math.min(1, percentage));

  let lower = colorStops[0];
  let upper = colorStops[colorStops.length - 1];

  for (let i = 1; i < colorStops.length; i++) {
    if (percentage <= colorStops[i].pct) {
      upper = colorStops[i];
      lower = colorStops[i - 1];
      break;
    }
  }

  const rangePct = (percentage - lower.pct) / (upper.pct - lower.pct);
  const r = Math.round(lower.color.r + rangePct * (upper.color.r - lower.color.r));
  const g = Math.round(lower.color.g + rangePct * (upper.color.g - lower.color.g));
  const b = Math.round(lower.color.b + rangePct * (upper.color.b - lower.color.b));

  return `rgb(${r}, ${g}, ${b})`;
}

function getGeoJsonStyle(progressValue: number): L.PathOptions {
  return {
    color: 'black',
    fillColor: getProgressColor(progressValue),
    fillOpacity: 0.7,
    weight: 2,
  };
}

function createLegend(L: any) {
  const control = new L.Control({ position: 'topright' });
  control.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    const grades = [1, 0.75, 0.5, 0.25, 0];

    div.innerHTML += '<p>凡例</p>';

    const legendInnerContainerDiv = L.DomUtil.create('div', 'legend-inner-container', div);
    legendInnerContainerDiv.innerHTML += '<div class="legend-gradient"></div>';

    const labelsDiv = L.DomUtil.create('div', 'legend-labels', legendInnerContainerDiv);
    for (let i = 0; i < grades.length; i++) {
      labelsDiv.innerHTML += `<span>${grades[i] * 100}%</span>`;
    }
    return div;
  };

  return control;
}

export default function SummaryPage() {
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    if (!mapInstance) return;

    const initializeSummaryMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Set initial view
      mapInstance.setView([35.669400214188606, 139.48343915372877], 11);

      // Add base layer
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Linked Open Addresses Japan',
      }).addTo(mapInstance);

      try {
        const [areaList, progress, progressCountdown] = await Promise.all([
          getAreaList(),
          getProgress(),
          getProgressCountdown()
        ]);

        // Load GeoJSON data for each area
        for (const [key, areaInfo] of Object.entries(areaList)) {
          try {
            const response = await fetch(`https://uedayou.net/loa/東京都${areaInfo.area_name}.geojson`);
            if (!response.ok) {
              throw new Error(`Failed to fetch geojson for ${areaInfo.area_name}`);
            }
            
            const geoJsonData = await response.json();
            const polygon = L.geoJSON(geoJsonData, {
              style: getGeoJsonStyle(progress[key] || 0),
            });
            
            polygon.bindPopup(`
              <b>${areaInfo.area_name}</b><br>
              ポスター貼り進捗: ${((progress[key] || 0) * 100).toFixed(1)}%<br>
              残り: ${progressCountdown[key] || 0}ヶ所
            `);
            
            polygon.addTo(mapInstance);
          } catch (error) {
            console.error(`Error fetching geojson for ${areaInfo.area_name}:`, error);
          }
        }

        // Add progress controls
        createProgressBox(L, Number((progress.total * 100).toFixed(2)), 'topright').addTo(mapInstance);
        createProgressBoxCountdown(L, parseInt(progressCountdown.total.toString()), 'topright').addTo(mapInstance);
        createLegend(L).addTo(mapInstance);

      } catch (error) {
        console.error('Error loading summary data:', error);
      }
    };

    initializeSummaryMap();
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
        .legend {
          line-height: 18px;
        }
        .legend-gradient {
          background: linear-gradient(to top, #feedde 0%, #fdbe85 25%, #fd8d3c 50%, #e6550d 75%, #a63603 100%);
          width: 20px;
          height: 100px;
        }
        .legend-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100px;
          margin-left: 5px;
        }
        .legend-inner-container {
          display: flex;
          align-items: center;
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