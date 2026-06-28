import { create } from 'zustand';
import { mapCenter } from '../../../data/visitorPois';

export const useLocationStore = create((set, get) => ({
  permissionStatus: 'idle',
  position: null,
  lastError: '',
  isFakeMode: false,
  watchId: null,
  isCameraLocked: true,

  activePoi: null,
  selectedStallId: null,
  isPoiSheetOpen: false,
  mapInstance: null,

  navigationTargetPoi: null,
  startNavigation: (poi) => set({ navigationTargetPoi: poi }),
  stopNavigation: () => set({ navigationTargetPoi: null }),

  setMapInstance: (mapInstance) => set({ mapInstance }),
  setIsCameraLocked: (isCameraLocked) => set({ isCameraLocked }),
  isDiscoveryOpen: false,
  setIsDiscoveryOpen: (isDiscoveryOpen) => set({ isDiscoveryOpen }),

  selectAndFocusPoi: (poi, mapInstance) => {
    set({
      activePoi: poi,
      selectedStallId: poi ? (poi.stall_id ?? poi.stallId ?? null) : null,
      isPoiSheetOpen: Boolean(poi)
    });
    const map = mapInstance || get().mapInstance;
    if (map && poi && poi.latitude && poi.longitude) {
      map.flyTo([poi.latitude, poi.longitude], 16, { animate: true, duration: 1.2 });
    }
  },

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
      const successCallback = (currentPosition) => {
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
      };

      const fallbackCallback = (fallbackError) => {
        console.warn('GPS fallback warning:', fallbackError);
        set({
          permissionStatus: 'granted',
          isFakeMode: true,
          lastError: 'Thời gian chờ GPS hết hạn. Đã kích hoạt vị trí mô phỏng khu vực.',
          position: { lat: mapCenter.lat, lng: mapCenter.lng, accuracy: 8 }
        });
        resolve(true);
      };

      const errorCallback = (error) => {
        if (error.code === 3) {
          // GeolocationPositionError: Timeout expired. Retry with enableHighAccuracy: false
          navigator.geolocation.getCurrentPosition(
            successCallback,
            fallbackCallback,
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 15000 }
          );
        } else {
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
        }
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
      );
    });
  },

  startWatching: () => {
    const { watchId, isFakeMode } = get();
    if (watchId || isFakeMode || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371000; // Radius of the earth in m
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const handleSuccess = (pos) => {
      const currentPos = get().position;
      const newLat = pos.coords.latitude;
      const newLng = pos.coords.longitude;

      let shouldUpdate = false;
      if (!currentPos) {
        shouldUpdate = true;
      } else {
        const distance = getHaversineDistance(
          currentPos.lat,
          currentPos.lng,
          newLat,
          newLng
        );
        if (distance > 2) {
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        set({
          position: {
            lat: newLat,
            lng: newLng,
            accuracy: pos.coords.accuracy
          }
        });
      }
    };

    const handleError = (err) => {
      console.warn('GPS watch error:', err);
      if (err.code === 3) {
        // Fallback to enableHighAccuracy: false if timeout
        get().stopWatching();
        const fallbackId = navigator.geolocation.watchPosition(
          handleSuccess,
          (fallbackErr) => {
            console.warn('GPS watch fallback error:', fallbackErr);
            if (!get().position) {
              set({
                position: { lat: mapCenter.lat, lng: mapCenter.lng, accuracy: 8 }
              });
            }
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
        );
        set({ watchId: fallbackId });
      }
    };

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
