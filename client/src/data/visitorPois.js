// Compatibility helpers only. Runtime POI and destination records must come
// from the backend; this module intentionally contains no bundled demo data.
export const mapCenter = Object.freeze({ lat: 10.77582, lng: 106.70208 });
export const visitorPois = Object.freeze([]);
export const destinationPreviews = Object.freeze([]);

export function getPoiById() {
  return null;
}

export function getLocalizedPoiContent(poi, languageCode = 'vi') {
  const descriptions = poi?.descriptions ?? {};
  const narrations = poi?.narration ?? {};
  return {
    description: descriptions[languageCode] || descriptions.vi || poi?.description || '',
    narration: narrations[languageCode] || narrations.vi || poi?.description || ''
  };
}

export function localizePoi(poi, languageCode = 'vi') {
  const titles = poi?.titles ?? {};
  return {
    ...poi,
    ...getLocalizedPoiContent(poi, languageCode),
    title: titles[languageCode] || titles.vi || poi?.title || poi?.name || ''
  };
}

export function localizeDestination(destination) {
  return destination;
}
