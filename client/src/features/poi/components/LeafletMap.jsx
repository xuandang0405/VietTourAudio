import L from 'leaflet';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents, Polyline, Popup } from 'react-leaflet';
import { mapCenter } from '../../../data/visitorPois';
import { useTranslation } from 'react-i18next';
import { useLocationStore } from '../../geofence-audio/stores/locationStore';

function MapCamera({ selectedPoi, position, isProgrammaticMoveRef }) {
  const map = useMap();
  const isCameraLocked = useLocationStore((state) => state.isCameraLocked);
  const lastSelectedPoiId = useRef(null);

  // One-shot camera alignment on selectedPoi changes
  useEffect(() => {
    if (!map || !map.getPane) return;
    if (!selectedPoi) {
      lastSelectedPoiId.current = null;
      return;
    }

    const isNewPoi = selectedPoi.id !== lastSelectedPoiId.current;
    if (isNewPoi) {
      lastSelectedPoiId.current = selectedPoi.id;
      if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
      map.flyTo([selectedPoi.latitude, selectedPoi.longitude], 18, {
        duration: 0.7
      });
      setTimeout(() => {
        if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
      }, 800);
    }
  }, [map, selectedPoi, isProgrammaticMoveRef]);

  // Continuous lock pan bám theo vị trí GPS của khách khi di chuyển
  useEffect(() => {
    if (!map || !map.getPane) return;
    if (isCameraLocked && position) {
      if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
      map.panTo([position.lat, position.lng], { animate: true, duration: 0.8 });
      setTimeout(() => {
        if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
      }, 900);
    }
  }, [map, position, isCameraLocked, isProgrammaticMoveRef]);

  return null;
}

function MapEventsHandler({ isProgrammaticMoveRef }) {
  const setIsCameraLocked = useLocationStore((state) => state.setIsCameraLocked);

  useMapEvents({
    dragstart: () => {
      if (!isProgrammaticMoveRef?.current) {
        setIsCameraLocked(false);
      }
    },
    zoomstart: () => {
      if (!isProgrammaticMoveRef?.current) {
        setIsCameraLocked(false);
      }
    },
    movestart: () => {
      if (!isProgrammaticMoveRef?.current) {
        setIsCameraLocked(false);
      }
    }
  });

  return null;
}

function MapResizeHandler() {
  const map = useMap();
  const activePoi = useLocationStore((state) => state.activePoi);
  const isPoiSheetOpen = useLocationStore((state) => state.isPoiSheetOpen);

  useEffect(() => {
    if (!map || !map.getPane) return;
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 350);

    return () => clearTimeout(timer);
  }, [map, activePoi, isPoiSheetOpen]);

  return null;
}

function MapRouteHandler({ routingCoordinates }) {
  const map = useMap();
  const lastCoordsJson = useRef('');

  useEffect(() => {
    if (!map || !map.getPane) return;
    if (!routingCoordinates || routingCoordinates.length === 0) return;

    const coordsJson = JSON.stringify(routingCoordinates);
    if (coordsJson !== lastCoordsJson.current) {
      lastCoordsJson.current = coordsJson;
      map.fitBounds(routingCoordinates, { padding: [60, 60] });
    }
  }, [map, routingCoordinates]);

  return null;
}

function MapZoneCenterHandler({ pois, zoneCenter }) {
  const map = useMap();
  const hasCenteredZone = useRef(false);
  const previousZoneCenter = useRef(null);

  // Reset the tracker if the zone center actually changes
  useEffect(() => {
    if (zoneCenter && (
      !previousZoneCenter.current ||
      previousZoneCenter.current.lat !== zoneCenter.lat ||
      previousZoneCenter.current.lng !== zoneCenter.lng
    )) {
      previousZoneCenter.current = zoneCenter;
      hasCenteredZone.current = false;
    }
  }, [zoneCenter]);

  useEffect(() => {
    if (!map || !map.getPane || !pois || pois.length === 0 || hasCenteredZone.current) return;

    const activePois = pois.filter((p) => p.latitude && p.longitude);
    if (activePois.length > 0) {
      const bounds = L.latLngBounds(activePois.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      hasCenteredZone.current = true;
    } else if (zoneCenter) {
      map.setView([zoneCenter.lat, zoneCenter.lng], 15);
      hasCenteredZone.current = true;
    }
  }, [map, pois, zoneCenter]);

  return null;
}

function getCategoryIcon(category) {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('food') || cat.includes('restaurant') || cat.includes('cuisine') || cat.includes('ăn') || cat.includes('uống') || cat.includes('ẩm thực')) {
    return '🍜';
  }
  if (cat.includes('heritage') || cat.includes('history') || cat.includes('historical') || cat.includes('lịch sử') || cat.includes('di sản')) {
    return '🏛️';
  }
  if (cat.includes('museum') || cat.includes('bảo tàng') || cat.includes('trưng bày')) {
    return '🖼️';
  }
  if (cat.includes('temple') || cat.includes('spiritual') || cat.includes('chùa') || cat.includes('đền') || cat.includes('thờ') || cat.includes('tôn giáo')) {
    return '🛕';
  }
  if (cat.includes('shop') || cat.includes('shopping') || cat.includes('stall') || cat.includes('mua') || cat.includes('bán') || cat.includes('sạp') || cat.includes('chợ')) {
    return '🛍️';
  }
  if (cat.includes('nature') || cat.includes('park') || cat.includes('công viên') || cat.includes('cây xanh') || cat.includes('vườn')) {
    return '🌿';
  }
  if (cat.includes('audio') || cat.includes('story') || cat.includes('thuyết minh') || cat.includes('nghe')) {
    return '🎧';
  }
  return '📍';
}

const createPoiIcon = ({ category, isActive }) => {
  const icon = getCategoryIcon(category);

  return L.divIcon({
    className: "custom-poi-marker bg-transparent border-none",
    html: `
      <div class="relative flex items-center justify-center">
        ${
          isActive
            ? `<span class="absolute inline-flex h-12 w-12 rounded-full bg-teal-400 opacity-75 animate-ping"></span>`
            : ""
        }

        <div class="
          relative flex items-center justify-center
          h-10 w-10 rounded-full
          border shadow-md
          transition-transform duration-200
          ${
            isActive
              ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white border-teal-300 scale-110 shadow-lg"
              : "bg-white text-teal-600 border-teal-100"
          }
        ">
          <span class="text-base">${icon}</span>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

const userIcon = L.divIcon({
  className: 'vta-user-location-marker bg-transparent border-none',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute inline-flex h-8 w-8 rounded-full bg-teal-400 opacity-30 animate-pulse"></div>
      <div class="relative flex items-center justify-center h-4 w-4 rounded-full bg-teal-500 border-2 border-white shadow-md"></div>
    </div>
  `,
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
      pois.map((poi, index) => {
        const latitude = Number.parseFloat(poi.latitude ?? poi.lat);
        const longitude = Number.parseFloat(poi.longitude ?? poi.lng ?? poi.long);
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude === 0 ||
          longitude === 0
        ) return null;

        const normalizedPoi = { ...poi, latitude, longitude };
        const isActive = selectedPoi?.id === poi.id || poi.isInsideRadius;
        return {
          poi: normalizedPoi,
          key: poi.id || `poi-marker-${index}`,
          active: isActive,
          icon: createPoiIcon({
            category: poi.category,
            isActive
          })
        };
      }).filter(Boolean),
    [pois, selectedPoi]
  );

  return (
    <>
      {markerData.map(({ poi, key, active, icon }) => (
        <Marker
          key={key}
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
            <span className="text-xs font-bold">{poi.stallName || poi.name || poi.title}</span>
          </Tooltip>
          <Popup className="tourism-popup">
            <div className="min-w-[220px] max-w-[280px] rounded-xl font-sans text-slate-900">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {poi.stallName || poi.name || poi.title}
              </h3>

              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {poi.description || poi.category}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    selectAndFocusPoi(poi, map);
                    onSelectPoi?.(poi);
                  }}
                  className="rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                >
                  Nghe thuyết minh
                </button>

                <button
                  type="button"
                  onClick={() => {
                    useLocationStore.getState().startNavigation(poi);
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Dẫn đường
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {markerData
        .filter(({ poi }) => poi.isInsideRadius)
        .map(({ poi, key }) => (
          <Circle
            key={`${key}-radius`}
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
    if (map && map.getPane) {
      setMapInstance(map);
    }
    return () => {
      setMapInstance(null);
    };
  }, [map, setMapInstance]);
  return null;
}

function LeafletMapComponent({ selectedPoi, enrichedPois, position, onSelectPoi, routingCoordinates, zoneCenter }) {
  const pois = Array.isArray(enrichedPois)
    ? enrichedPois
        .map((poi) => ({
          ...poi,
          latitude: Number.parseFloat(poi.latitude ?? poi.lat),
          longitude: Number.parseFloat(poi.longitude ?? poi.lng ?? poi.long)
        }))
        .filter((poi) =>
          Number.isFinite(poi.latitude) &&
          Number.isFinite(poi.longitude) &&
          poi.latitude !== 0 &&
          poi.longitude !== 0)
    : [];
  const hasActiveRoute = Boolean(routingCoordinates && routingCoordinates.length > 0);
  const isProgrammaticMoveRef = useRef(false);

  return (
    <div className="absolute inset-0 z-0 w-full h-full block">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={17}
        minZoom={3}
        maxZoom={20}
        maxBounds={[[5.5, 102.0], [24.0, 110.0]]}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl
        preferCanvas={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={20}
          maxNativeZoom={19}
          keepBuffer={8}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        <MapRegister />
        <MapEventsHandler isProgrammaticMoveRef={isProgrammaticMoveRef} />
        <MapResizeHandler />
        <MapZoneCenterHandler pois={pois} zoneCenter={zoneCenter} />
        <MapCamera selectedPoi={selectedPoi} position={position} isProgrammaticMoveRef={isProgrammaticMoveRef} />
        <MapRouteHandler routingCoordinates={routingCoordinates} />
        <MapMarkers pois={pois} selectedPoi={selectedPoi} position={position} onSelectPoi={onSelectPoi} />
        {hasActiveRoute && (
          <>
            <Polyline
              positions={routingCoordinates}
              color="#0d9488"
              weight={10}
              opacity={0.25}
              lineCap="round"
              smoothFactor={1.5}
            />
            <Polyline
              positions={routingCoordinates}
              color="#0f766e"
              weight={5}
              opacity={1.0}
              lineCap="round"
              lineJoin="round"
              dashArray="10, 15"
              className="animate-route-flow"
              smoothFactor={1.5}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}

export const LeafletMap = memo(LeafletMapComponent);
