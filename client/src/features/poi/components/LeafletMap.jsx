import L from 'leaflet';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { mapCenter, visitorPois } from '../../../data/visitorPois';
import { useTranslation } from 'react-i18next';
import { useLocationStore } from '../../geofence-audio/stores/locationStore';

function MapCamera({ selectedPoi, position, hasActiveRoute, zoneCenter }) {
  const map = useMap();
  const lastZoneCenter = useRef(null);
  const isAutoPanEnabled = useLocationStore((state) => state.isAutoPanEnabled);

  useEffect(() => {
    if (zoneCenter && (!lastZoneCenter.current || lastZoneCenter.current.lat !== zoneCenter.lat || lastZoneCenter.current.lng !== zoneCenter.lng)) {
      lastZoneCenter.current = zoneCenter;
      map.flyTo([zoneCenter.lat, zoneCenter.lng], 16, {
        animate: true,
        duration: 1.5
      });
    }
  }, [map, zoneCenter]);

  useEffect(() => {
    if (hasActiveRoute) return;

    if (selectedPoi) {
      map.flyTo([selectedPoi.latitude, selectedPoi.longitude], 18, {
        duration: 0.7
      });
      return;
    }

    if (position && !isAutoPanEnabled) {
      map.flyTo([position.lat, position.lng], 17, {
        duration: 0.7
      });
    }
  }, [map, position, selectedPoi, hasActiveRoute, isAutoPanEnabled]);

  useEffect(() => {
    if (isAutoPanEnabled && position) {
      map.panTo([position.lat, position.lng], { animate: true, duration: 0.8 });
    }
  }, [map, position, isAutoPanEnabled]);

  return null;
}

function MapEventsHandler() {
  const setAutoPanEnabled = useLocationStore((state) => state.setAutoPanEnabled);

  useMapEvents({
    dragstart: () => {
      setAutoPanEnabled(false);
    }
  });

  return null;
}

function MapRouteHandler({ routingCoordinates, position, selectedPoi, zoneCenter }) {
  const map = useMap();

  useEffect(() => {
    if (routingCoordinates && routingCoordinates.length > 0) {
      map.fitBounds(routingCoordinates, { padding: [60, 60] });
    } else if (selectedPoi) {
      map.setView([selectedPoi.latitude, selectedPoi.longitude], 17, { animate: true });
    } else if (zoneCenter) {
      map.setView([zoneCenter.lat, zoneCenter.lng], 15, { animate: true });
    }
  }, [map, routingCoordinates, selectedPoi, zoneCenter]);

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
  const map = useMap();
  const selectAndFocusPoi = useLocationStore((state) => state.selectAndFocusPoi);
  const { t } = useTranslation();

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
            click: () => {
              selectAndFocusPoi(poi, map);
              onSelectPoi?.(poi);
            }
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
            <span className="text-xs font-bold">{t('landing.yourLocation', { defaultValue: 'Vị trí của bạn' })}</span>
          </Tooltip>
        </Marker>
      )}
    </>
  );
});

function MapRegister() {
  const map = useMap();
  const setMapInstance = useLocationStore((state) => state.setMapInstance);
  useEffect(() => {
    if (map) {
      setMapInstance(map);
    }
    return () => {
      setMapInstance(null);
    };
  }, [map, setMapInstance]);
  return null;
}

function LeafletMapComponent({ selectedPoi, enrichedPois, position, onSelectPoi, routingCoordinates, zoneCenter }) {
  const pois = Array.isArray(enrichedPois) && enrichedPois.length > 0 ? enrichedPois : visitorPois;
  const hasActiveRoute = Boolean(routingCoordinates && routingCoordinates.length > 0);

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
      <MapRegister />
      <MapEventsHandler />
      <MapCamera selectedPoi={selectedPoi} position={position} hasActiveRoute={hasActiveRoute} zoneCenter={zoneCenter} />
      <MapRouteHandler routingCoordinates={routingCoordinates} position={position} selectedPoi={selectedPoi} zoneCenter={zoneCenter} />
      <MapMarkers pois={pois} selectedPoi={selectedPoi} position={position} onSelectPoi={onSelectPoi} />
      {hasActiveRoute && (
        <>
          <Polyline
            positions={routingCoordinates}
            color="#2563eb"
            weight={9}
            opacity={0.35}
            lineCap="round"
          />
          <Polyline
            positions={routingCoordinates}
            color="#3b82f6"
            weight={5}
            opacity={1.0}
            lineCap="round"
            lineJoin="round"
          />
        </>
      )}
    </MapContainer>
  );
}

export const LeafletMap = memo(LeafletMapComponent);
