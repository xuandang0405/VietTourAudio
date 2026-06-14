import { create } from 'zustand';
import { mapCenter } from '../data/visitorPois';

export const useLocationStore = create((set, get) => ({
  permissionStatus: 'idle',
  position: null,
  lastError: '',
  isFakeMode: false,
  watchId: null,

  requestLocation: () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({
        permissionStatus: 'unavailable',
        lastError: 'Thiết bị hoặc trình duyệt chưa hỗ trợ GPS.'
      });
      return Promise.resolve(false);
    }

    set({ permissionStatus: 'requesting', lastError: '' });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (currentPosition) => {
          set({
            permissionStatus: 'granted',
            isFakeMode: false,
            position: {
              lat: currentPosition.coords.latitude,
              lng: currentPosition.coords.longitude,
              accuracy: currentPosition.coords.accuracy
            }
          });
          get().startWatching();
          resolve(true);
        },
        (error) => {
          set({
            permissionStatus: 'denied',
            lastError:
              error.code === 1
                ? 'Quyền vị trí bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.'
                : error.code === 2
                  ? 'Không thể xác định vị trí hiện tại do tín hiệu GPS yếu.'
                  : 'Quá thời gian lấy vị trí. Vui lòng thử lại ở nơi thoáng hơn.'
          });
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 15000 }
      );
    });
  },

  startWatching: () => {
    const { watchId, isFakeMode } = get();
    if (watchId || isFakeMode || typeof navigator === 'undefined' || !navigator.geolocation) return;

    let lastUpdate = 0;
    const throttleMs = 5000;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdate >= throttleMs) {
          lastUpdate = now;
          set({
            position: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            }
          });
        }
      },
      (err) => {
        console.warn('GPS watch error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );

    set({ watchId: id });
  },

  stopWatching: () => {
    const { watchId } = get();
    if (watchId && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
    }
  },

  useDemoLocation: () => {
    get().stopWatching();
    set({
      permissionStatus: 'granted',
      isFakeMode: true,
      lastError: '',
      position: { lat: mapCenter.lat, lng: mapCenter.lng, accuracy: 8 }
    });
  },

  simulateNearPoi: (poi) => {
    if (!poi) return;

    get().stopWatching();
    set({
      permissionStatus: 'granted',
      isFakeMode: true,
      lastError: '',
      position: { lat: poi.latitude + 0.00002, lng: poi.longitude + 0.00002, accuracy: 4 }
    });
  },

  clearLocation: () => {
    get().stopWatching();
    set({
      permissionStatus: 'idle',
      position: null,
      lastError: '',
      isFakeMode: false
    });
  },

  hasLocation: () => Boolean(get().position)
}));
