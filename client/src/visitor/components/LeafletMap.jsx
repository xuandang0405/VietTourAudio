import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { mapCenter, visitorPois } from '../../data/visitorPois';
import { useTranslation } from '../../i18n/translations';

function MapCamera({ selectedPoi, position }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPoi) {
      map.flyTo([selectedPoi.latitude, selectedPoi.longitude], 18, {
        duration: 0.7
      });
      return;
    }

    if (position) {
      map.flyTo([position.lat, position.lng], 17, {
        duration: 0.7
      });
    }
  }, [map, position, selectedPoi]);

  return null;
}

export function LeafletMap({ selectedPoi, enrichedPois, position, onSelectPoi }) {
  const { t } = useTranslation();
  const pois = enrichedPois.length > 0 ? enrichedPois : visitorPois;

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={17}
      minZoom={5}
      maxZoom={19}
      className="h-full w-full"
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCamera selectedPoi={selectedPoi} position={position} />

      {pois.map((poi) => {
        const active = selectedPoi?.id === poi.id || poi.isInsideRadius;
        const color = poi.isPremiumPoi ? '#f97316' : '#0f766e';

        return (
          <CircleMarker
            key={poi.id}
            center={[poi.latitude, poi.longitude]}
            radius={active ? 13 : 10}
            pathOptions={{
              color: '#ffffff',
              weight: 3,
              fillColor: color,
              fillOpacity: active ? 0.95 : 0.85
            }}
            eventHandlers={{
              click: () => onSelectPoi(poi)
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <span className="text-xs font-bold">{poi.title}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {pois
        .filter((poi) => poi.isInsideRadius || selectedPoi?.id === poi.id)
        .map((poi) => (
          <Circle
            key={`${poi.id}-radius`}
            center={[poi.latitude, poi.longitude]}
            radius={poi.activationRadius}
            pathOptions={{
              color: '#0f766e',
              fillColor: '#14b8a6',
              fillOpacity: 0.08,
              weight: 1
            }}
          />
        ))}

      {position && (
        <CircleMarker
          center={[position.lat, position.lng]}
          radius={8}
          pathOptions={{
            color: '#ffffff',
            weight: 3,
            fillColor: '#2563eb',
            fillOpacity: 0.92
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1}>
            <span className="text-xs font-bold">{t('yourLocation')}</span>
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
