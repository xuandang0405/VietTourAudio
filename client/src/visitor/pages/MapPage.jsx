import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { visitorPois } from '../../data/visitorPois';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAudioStore } from '../../stores/audioStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { enrichPoisWithDistance } from '../../utils/geo';
import { MobileLayout } from '../layouts/MobileLayout';
import { PCLayout } from '../layouts/PCLayout';
import { TabletLayout } from '../layouts/TabletLayout';

export function MapPage({ onUpgrade, onToast }) {
  const breakpoint = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPoiId, setSelectedPoiId] = useState(searchParams.get('poi'));
  const position = useLocationStore((state) => state.position);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const useDemoLocation = useLocationStore((state) => state.useDemoLocation);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const canAutoPlay = useAudioStore((state) => state.canAutoPlay);
  const enqueuePoi = useAudioStore((state) => state.enqueuePoi);
  const getLanguageMeta = useLanguageStore((state) => state.getLanguageMeta);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const enrichedPois = useMemo(() => {
    if (!position) {
      return visitorPois.map((poi) => ({
        ...poi,
        distanceLabel: poi.distanceHint,
        isInsideRadius: false
      }));
    }

    return enrichPoisWithDistance(visitorPois, position);
  }, [position]);

  const selectedPoi = useMemo(
    () => enrichedPois.find((poi) => poi.id === selectedPoiId) ?? null,
    [enrichedPois, selectedPoiId]
  );

  const activeAutoPoi = useMemo(() => enrichedPois.find((poi) => poi.isInsideRadius) ?? null, [enrichedPois]);

  useEffect(() => {
    setSelectedPoiId(searchParams.get('poi'));
  }, [searchParams]);

  useEffect(() => {
    if (!isPremium || !activeAutoPoi || !canAutoPlay(activeAutoPoi.id)) {
      return;
    }

    enqueuePoi(activeAutoPoi, getLanguageMeta());
    setSelectedPoiId(activeAutoPoi.id);
    setSearchParams({ poi: activeAutoPoi.id }, { replace: true });
    onToast?.('Đã vào vùng. Đang thêm vào hàng đợi phát âm thanh...');
  }, [activeAutoPoi, canAutoPlay, currentLanguage, getLanguageMeta, isPremium, onToast, enqueuePoi, setSearchParams]);

  function handleSelectPoi(poi) {
    if (!poi?.id) return;

    setSelectedPoiId(poi.id);
    setSearchParams({ poi: poi.id });
  }

  async function handleLocate() {
    const allowed = await requestLocation();
    if (allowed) {
      onToast?.('Đã cập nhật vị trí hiện tại.');
      return;
    }

    onToast?.('Không lấy được GPS. Đang chuyển sang vị trí demo.');
    useDemoLocation();
  }

  const layoutProps = {
    searchParams,
    setSearchParams,
    selectedPoi,
    enrichedPois,
    position,
    permissionStatus,
    handleSelectPoi,
    handleLocate,
    onUpgrade,
    onToast
  };

  if (breakpoint === 'pc') {
    return <PCLayout {...layoutProps} />;
  }

  if (breakpoint === 'tablet') {
    return <TabletLayout {...layoutProps} />;
  }

  return <MobileLayout {...layoutProps} />;
}
