import { create } from 'zustand';
import { getTour, getZonesByTour } from '../services/idb';

export const useZoneStore = create((set, get) => ({
  currentTour: null,
  zones: [],
  currentLocation: null,
  nearestZone: null,
  activeZone: null,
  enteredZoneIds: {},
  tourUnlocked: false,
  lastScanResult: null,
  setTour: (currentTour) => set({ currentTour }),
  setZones: (zones) => set({ zones }),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setNearestZone: (nearestZone) => set({ nearestZone }),
  setActiveZone: (activeZone) => set({ activeZone }),
  setTourUnlocked: (tourUnlocked) => set({ tourUnlocked }),
  setLastScanResult: (lastScanResult) => set({ lastScanResult }),
  markEntered: (zoneId) => set((s) => ({ enteredZoneIds: { ...s.enteredZoneIds, [zoneId]: Date.now() } })),
  hydrateFromCache: async (tourId) => {
    set({ currentTour: null, zones: [] });
    const tour = await getTour(Number(tourId));
    const zones = await getZonesByTour(Number(tourId));
    set({ currentTour: tour || null, zones: zones || [] });
    return { tour, zones };
  }
}));
