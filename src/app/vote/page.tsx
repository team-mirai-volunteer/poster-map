'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getAreaList, getVoteVenuePins } from '@/lib/api';
import { createBaseLayers, createGrayIcon } from '@/lib/map-utils';
import { AreaList, VoteVenue } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

async function loadVoteVenuePins(layer: any, L: any) {
  const pins = await getVoteVenuePins();
  const grayIcon = createGrayIcon(L);
  pins.forEach(pin => {
    const marker = L.marker([pin.lat, pin.long], {
      icon: grayIcon
    }).addTo(layer);
    marker.bindPopup(`
      <b>期日前投票所: ${pin.name}</b><br>
      ${pin.address}<br>
      期間: ${pin.period}<br>
      座標: <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a>
    `);
  });
}

export default function VotePage() {
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    if (!mapInstance) return;

    const initializeVoteMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Create overlay layers
      const overlays = {
        '期日前投票所': L.layerGroup(),
      };

      // Add overlay to map
      overlays['期日前投票所'].addTo(mapInstance);

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

      // Handle geolocation
      mapInstance.on('locationfound', (e: any) => {
        const radius = e.accuracy / 2;
        
        const locationMarker = L.marker(e.latlng).addTo(mapInstance)
          .bindPopup("現在地").openPopup();
        const locationCircle = L.circle(e.latlng, radius).addTo(mapInstance);
        
        mapInstance.setView(e.latlng, 14);
      });

      mapInstance.on('locationerror', () => {
        const latlong: [number, number] = [35.670687, 139.562997];
        const zoom = 12;
        mapInstance.setView(latlong, zoom);
      });

      mapInstance.locate({ setView: false, maxZoom: 14 });

      try {
        // Load area boundaries
        const areaList = await getAreaList();
        
        for (const [key, areaInfo] of Object.entries(areaList)) {
          try {
            const response = await fetch(`https://uedayou.net/loa/東京都${areaInfo.area_name}.geojson`);
            if (!response.ok) {
              throw new Error(`Failed to fetch geojson for ${areaInfo.area_name}`);
            }
            
            const geoJsonData = await response.json();
            const polygon = L.geoJSON(geoJsonData, {
              style: {
                color: 'black',
                fillColor: "black",
                fillOpacity: 0.1,
                weight: 2,
              }
            });
            
            polygon.addTo(mapInstance);
          } catch (error) {
            console.error(`Error fetching geojson for ${areaInfo.area_name}:`, error);
          }
        }

        // Load vote venue pins
        await loadVoteVenuePins(overlays['期日前投票所'], L);

      } catch (error) {
        console.error('Error loading vote data:', error);
      }
    };

    initializeVoteMap();
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
        .icon-gray {
          filter: grayscale(100%);
        }
      `}</style>
      <Map onMapReady={setMapInstance} />
    </>
  );
}