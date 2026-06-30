import { analyticsService } from '../../../services/analyticsService';
import { getVisitorSessionId, markEventOnce } from '../../../utils/visitorSession';

function send(request) {
  request.catch(() => {
    // The visitor experience remains usable when the prototype API is offline.
  });
}

export const visitorTrackingService = {
  trackVisit(poi, position, distanceMeters) {
    if (!poi?.apiId || !position || !markEventOnce('visit', poi.apiId)) {
      return;
    }

    send(analyticsService.trackVisit({
      stallId: poi.stallId,
      poiId: poi.apiId,
      userId: null,
      sessionId: getVisitorSessionId(),
      latitude: position.lat,
      longitude: position.lng,
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null
    }));
  },

  trackAudioPlay(poi, languageCode) {
    if (!poi?.apiId) {
      return;
    }

    send(analyticsService.trackAudioPlay({
      userId: null,
      sessionId: getVisitorSessionId(),
      poiId: poi.apiId,
      languageCode
    }));
  },

  trackQrScan(poi) {
    if (!poi?.apiId || !markEventOnce('qr', poi.qrCodeId ?? poi.apiId)) {
      return;
    }

    send(analyticsService.trackQrScan({
      qrCodeId: poi.qrCodeId ?? poi.apiId,
      stallId: poi.stallId,
      poiId: poi.apiId,
      userId: null,
      sessionId: getVisitorSessionId(),
      countryCode: null
    }));
  }
};
