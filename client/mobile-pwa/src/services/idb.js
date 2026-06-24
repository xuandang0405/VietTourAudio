import { openDB } from 'idb';

const DB_NAME = 'viettouraudio-db';
const DB_VERSION = 1;

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('tours')) database.createObjectStore('tours', { keyPath: 'id' });
      if (!database.objectStoreNames.contains('zones')) {
        const store = database.createObjectStore('zones', { keyPath: 'id' });
        store.createIndex('tourId', 'tourId');
      }
      if (!database.objectStoreNames.contains('narrations')) database.createObjectStore('narrations', { keyPath: ['zoneId', 'language'] });
      if (!database.objectStoreNames.contains('favorites')) database.createObjectStore('favorites', { keyPath: ['guestId', 'zoneId'] });
      if (!database.objectStoreNames.contains('pendingOps')) database.createObjectStore('pendingOps', { keyPath: 'id', autoIncrement: true });
      if (!database.objectStoreNames.contains('settings')) database.createObjectStore('settings', { keyPath: 'key' });
      if (!database.objectStoreNames.contains('analyticsQueue')) database.createObjectStore('analyticsQueue', { keyPath: 'id', autoIncrement: true });
    }
  });
}

export async function saveTour(tour) { (await db()).put('tours', tour); }
export async function getTour(id) { return (await db()).get('tours', id); }
export async function saveZones(tourId, zones) {
  const database = await db();
  const tx = database.transaction('zones', 'readwrite');
  for (const z of zones) tx.store.put({ ...z, tourId });
  await tx.done;
}
export async function getZonesByTour(tourId) { return (await db()).getAllFromIndex('zones', 'tourId', Number(tourId)); }
export async function saveNarration(narration) { (await db()).put('narrations', narration); }
export async function getNarration(zoneId, language) { return (await db()).get('narrations', [Number(zoneId), language]); }
export async function getFavorites(guestId) { return (await db()).getAll('favorites').then((all) => all.filter((x) => x.guestId === guestId)); }
export async function putFavorite(guestId, zone) { (await db()).put('favorites', { guestId, zoneId: zone.id, zone, createdAt: Date.now() }); }
export async function removeFavorite(guestId, zoneId) { (await db()).delete('favorites', [guestId, Number(zoneId)]); }
export async function addPendingOp(op) { return (await db()).add('pendingOps', op); }
export async function getPendingOps() { return (await db()).getAll('pendingOps'); }
export async function clearPendingOps(ids) {
  const database = await db();
  if (!ids) {
    const tx = database.transaction('pendingOps', 'readwrite');
    await tx.store.clear();
    return;
  }
  const tx = database.transaction('pendingOps', 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
}
export async function queueAnalytics(event) { return (await db()).add('analyticsQueue', event); }
export async function getQueuedAnalytics() { return (await db()).getAll('analyticsQueue'); }
export async function clearQueuedAnalytics(ids) {
  const database = await db();
  const tx = database.transaction('analyticsQueue', 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
}
export async function setSetting(key, value) { (await db()).put('settings', { key, value }); }
export async function getSetting(key) { return (await db()).get('settings', key); }
