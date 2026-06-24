import { useGeofenceAudio } from '../../geofence-audio/hooks/useGeofenceAudio';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { MobileLayout } from '../../../visitor/layouts/MobileLayout';
import { PCLayout } from '../../../visitor/layouts/PCLayout';
import { TabletLayout } from '../../../visitor/layouts/TabletLayout';

/**
 * [UC08] View Nearby POI & Audio Playback.
 * Map page UI view, delegating location and audio play queues tracking
 * to the useGeofenceAudio hook.
 */
export function MapPage({ onUpgrade, onToast }) {
  const breakpoint = useBreakpoint();
  const geofenceProps = useGeofenceAudio({ onToast });

  const layoutProps = {
    ...geofenceProps,
    onUpgrade,
    onToast
  };

  if (breakpoint === 'pc') return <PCLayout {...layoutProps} />;
  if (breakpoint === 'tablet') return <TabletLayout {...layoutProps} />;
  return <MobileLayout {...layoutProps} />;
}

