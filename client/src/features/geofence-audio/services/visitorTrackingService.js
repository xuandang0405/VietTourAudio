import { analyticsService } from '../../../services/analyticsService';
import { getVisitorSessionId, markEventOnce } from '../../../utils/visitorSession';
import axios from 'axios';
import { appConfig } from '../../../config/appConfig';

function send(request) {
  request.catch(() => {
    // The visitor experience remains usable when the prototype API is offline.
  });
}

export const visitorTrackingService = {
  trackVisit(poi, position, distanceMeters) {
    const poiId = poi?.apiId || poi?.id;
    if (!poiId || !position || !markEventOnce('visit', poiId)) {
      return;
    }

    send(analyticsService.trackVisit({
      stallId: poi.stallId,
      poiId: poiId,
      userId: null,
      sessionId: getVisitorSessionId(),
      latitude: position.lat,
      longitude: position.lng,
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null
    }));

    axios.post(`${appConfig.guestApiBaseUrl}/pois/${poiId}/track?action=visit`).catch(() => {});
  },

  trackAudioPlay(poi, languageCode) {
    const poiId = poi?.apiId || poi?.id;
    if (!poiId) {
      return;
    }

    // reads once, increments once per session to prevent spam
    if (!markEventOnce('listen', poiId)) {
      return;
    }

    send(analyticsService.trackAudioPlay({
      userId: null,
      sessionId: getVisitorSessionId(),
      poiId: poiId,
      languageCode
    }));

    axios.post(`${appConfig.guestApiBaseUrl}/pois/${poiId}/track?action=listen`).catch(() => {});
  },

  trackQrScan(poi) {
    const poiId = poi?.apiId || poi?.id;
    if (!poiId || !markEventOnce('qr', poi.qrCodeId ?? poiId)) {
      return;
    }

    send(analyticsService.trackQrScan({
      qrCodeId: poi.qrCodeId ?? poiId,
      stallId: poi.stallId,
      poiId: poiId,
      userId: null,
      sessionId: getVisitorSessionId(),
      countryCode: null
    }));
  }
};
