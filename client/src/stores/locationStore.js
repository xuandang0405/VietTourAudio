import { create } from 'zustand';
import { mapCenter } from '../data/visitorPois';

export const useLocationStore = create((set, get) => ({
  permissionStatus: 'idle',
  position: null,
  lastError: '',
  isFakeMode: false,
  requestLocation: () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({
        permissionStatus: 'unavailable',
        lastError: 'Thiết bị hoặc trình duyệt chưa hỗ trợ GPS.'
      });
      return Promise.resolve(false);
    }

    set({
      permissionStatus: 'requesting',
      lastError: ''
    });

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
          resolve(true);
        },
        (error) => {
          set({
            permissionStatus: 'denied',
            lastError: error.message || 'Không thể lấy vị trí hiện tại.'
          });
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 9000,
          maximumAge: 15000
        }
      );
    });
  },
  useDemoLocation: () => {
    set({
      permissionStatus: 'granted',
      isFakeMode: true,
      lastError: '',
      position: {
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        accuracy: 8
      }
    });
  },
  simulateNearPoi: (poi) => {
    set({
      permissionStatus: 'granted',
      isFakeMode: true,
      lastError: '',
      position: {
        lat: poi.latitude + 0.00002,
        lng: poi.longitude + 0.00002,
        accuracy: 4
      }
    });
  },
  clearLocation: () => {
    set({
      permissionStatus: 'idle',
      position: null,
      lastError: '',
      isFakeMode: false
    });
  },
  hasLocation: () => Boolean(get().position)
}));
