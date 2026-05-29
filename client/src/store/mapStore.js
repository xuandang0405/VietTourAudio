import { create } from 'zustand';

export const useMapStore = create((set) => ({
  currentLocation: null,
  nearbyPois: [],
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setNearbyPois: (nearbyPois) => set({ nearbyPois })
}));
