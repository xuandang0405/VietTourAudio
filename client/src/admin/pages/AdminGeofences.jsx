import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { visitorPois } from '../../data/visitorPois';

// Simple teal marker for admin
const createAdminMarker = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 16px; height: 16px; background-color: #0D9488; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export function AdminGeofences() {
  const center = [10.7769, 106.7009]; // Focus HCM initially

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-8 shrink-0">
        <h2 className="text-2xl font-black text-slate-900">Bản đồ Geofences</h2>
        <p className="text-slate-500 mt-1">Quản lý các vùng kích hoạt tự động (Auto-play radius) của toàn bộ POI.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 relative min-h-[500px]">
        <MapContainer center={center} zoom={15} className="w-full h-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visitorPois.map(poi => {
            if (!poi.location) return null;
            return (
              <div key={poi.id}>
                <Circle 
                  center={[poi.location.lat, poi.location.lng]} 
                  radius={poi.activationRadius || 50}
                  pathOptions={{ color: '#0D9488', fillColor: '#0D9488', fillOpacity: 0.15, weight: 1 }}
                />
                <Marker 
                  position={[poi.location.lat, poi.location.lng]}
                  icon={createAdminMarker()}
                >
                  <Popup className="rounded-xl overflow-hidden shadow-xl">
                    <div className="p-1">
                      <p className="font-bold text-slate-900">{poi.title}</p>
                      <p className="text-xs text-slate-500 mt-1">Bán kính: {poi.activationRadius || 50}m</p>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
