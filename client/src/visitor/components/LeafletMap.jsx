import L from 'leaflet';
import { memo, useEffect, useMemo } from 'react';
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { mapCenter, visitorPois } from '../../data/visitorPois';

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

function createPoiIcon({ active, premium }) {
  const markerClass = [
    'poi-marker',
    premium ? 'poi-marker--premium' : 'poi-marker--free',
    active ? 'poi-marker--active' : ''
  ].join(' ');

  return L.divIcon({
    className: 'vta-poi-icon',
    html: `<span class="${markerClass}" aria-hidden="true"></span>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    tooltipAnchor: [0, -18]
  });
}

const userIcon = L.divIcon({
  className: 'vta-poi-icon',
  html: '<span class="user-marker" aria-hidden="true"></span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  tooltipAnchor: [0, -14]
});

const MapMarkers = memo(function MapMarkers({ pois, selectedPoi, position, onSelectPoi }) {
  const markerData = useMemo(
    () =>
      pois.map((poi) => ({
        poi,
        active: selectedPoi?.id === poi.id || poi.isInsideRadius,
        icon: createPoiIcon({
          active: selectedPoi?.id === poi.id || poi.isInsideRadius,
          premium: poi.isPremiumPoi
        })
      })),
    [pois, selectedPoi]
  );

  return (
    <>
      {markerData.map(({ poi, active, icon }) => (
        <Marker
          key={poi.id}
          position={[poi.latitude, poi.longitude]}
          icon={icon}
          zIndexOffset={active ? 999 : 0}
          eventHandlers={{
            click: () => onSelectPoi?.(poi)
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <span className="text-xs font-bold">{poi.title}</span>
          </Tooltip>
        </Marker>
      ))}

      {pois
        .filter((poi) => poi.isInsideRadius)
        .map((poi) => (
          <Circle
            key={`${poi.id}-radius`}
            center={[poi.latitude, poi.longitude]}
            radius={poi.activationRadius}
            pathOptions={{
              color: '#22D3EE',
              fillColor: '#22D3EE',
              fillOpacity: 0.08,
              weight: 1
            }}
          />
        ))}

      {position && (
        <Marker position={[position.lat, position.lng]} icon={userIcon} zIndexOffset={1000}>
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <span className="text-xs font-bold">Vị trí của bạn</span>
          </Tooltip>
        </Marker>
      )}
    </>
  );
});

function LeafletMapComponent({ selectedPoi, enrichedPois, position, onSelectPoi }) {
  const pois = Array.isArray(enrichedPois) && enrichedPois.length > 0 ? enrichedPois : visitorPois;

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
      <MapMarkers pois={pois} selectedPoi={selectedPoi} position={position} onSelectPoi={onSelectPoi} />
    </MapContainer>
  );
}

export const LeafletMap = memo(LeafletMapComponent);
