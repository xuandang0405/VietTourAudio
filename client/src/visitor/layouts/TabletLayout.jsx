import { Crown, Languages, Menu, SatelliteDish } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '../../assets/logo/logo.png';
import logoText from '../../assets/logo/logo-text.png';
import { useLanguageStore } from '../../stores/languageStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { DevGpsPanel } from '../components/DevGpsPanel';
import { LeafletMap } from '../components/LeafletMap';
import { PoiBottomSheet } from '../components/PoiBottomSheet';
import { SharedAudioBar } from '../components/SharedAudioBar';
import { SidebarContent } from '../components/SidebarContent';

export function TabletLayout({
  searchParams,
  setSearchParams,
  selectedPoi,
  enrichedPois = [],
  position,
  permissionStatus,
  handleSelectPoi,
  handleLocate,
  onUpgrade,
  onToast
}) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const getFormattedCountdown = usePremiumStore((state) => state.getFormattedCountdown);
  const [countdown, setCountdown] = useState(getFormattedCountdown());

  useEffect(() => {
    if (!isPremium) return undefined;

    const interval = window.setInterval(() => {
      setCountdown(getFormattedCountdown());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPremium, getFormattedCountdown]);

  return (
    <section className="relative flex h-[100vh] min-h-[100vh] w-full flex-col overflow-hidden bg-transparent">
      <header className="z-[1300] flex h-14 flex-shrink-0 items-center justify-between border-b border-glassBorder bg-bgSurface/80 px-4 shadow-glass-inner backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="-ml-2 rounded-full border border-transparent bg-transparent p-2 text-textSeafoam transition duration-150 ease-out hover:border-electricBlue/30 hover:bg-white/10 hover:text-textCrisp active:scale-[0.98]"
            aria-label="Mở danh sách khu vực"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img className="h-8 w-8 rounded-lg shadow-neon-cyan" src={logo} alt="VietTourAudio" loading="lazy" decoding="async" />
            <img className="h-5 object-contain brightness-0 invert" src={logoText} alt="VietTourAudio" loading="lazy" decoding="async" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPremium ? (
            <div className="flex items-center gap-1.5 rounded-full border border-premiumNeon/30 bg-premiumNeon/10 px-3 py-1.5 shadow-neon-premium">
              <Crown size={14} className="text-premiumNeon" />
              <span className="font-mono text-xs font-bold tabular-nums text-textCrisp">{countdown}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onUpgrade}
              className="rounded-full border border-premiumNeon/30 bg-premiumNeon/10 px-3 py-1.5 text-xs font-bold text-premiumNeon transition duration-150 ease-out hover:bg-premiumNeon/15 active:scale-[0.98]"
            >
              Mở khóa
            </button>
          )}

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex h-9 items-center gap-1.5 rounded-full border border-glassBorder bg-white/5 px-2.5 text-xs font-bold uppercase text-textCrisp shadow-glass-inner transition duration-150 ease-out hover:border-electricBlue/40 hover:bg-white/10 active:scale-[0.98]"
          >
            <Languages size={14} />
            {currentLanguage}
          </button>
        </div>
      </header>

      <div className="relative flex-1 pb-[72px]">
        <div className="absolute inset-0">
          <LeafletMap selectedPoi={selectedPoi} enrichedPois={enrichedPois} position={position} onSelectPoi={handleSelectPoi} />
        </div>

        {searchParams.get('debug') === 'gps' && <DevGpsPanel onToast={onToast} />}

        {!position && (
          <article className="glass-card absolute left-6 right-6 top-6 z-[1200] mx-auto max-w-sm p-4 text-center">
            <SatelliteDish className="mx-auto text-oceanCyan" size={30} />
            <h2 className="mt-2 font-display text-base font-bold text-textCrisp">Đang tìm kiếm vị trí của bạn</h2>
            <p className="mt-1 text-sm leading-6 text-textSeafoam">
              Hãy đảm bảo bạn đã cấp quyền GPS. Bạn vẫn có thể dùng vị trí demo để kiểm thử giao diện.
            </p>
            <button
              type="button"
              onClick={handleLocate}
              disabled={permissionStatus === 'requesting'}
              className="mt-3 w-full rounded-full bg-oceanCyan px-4 py-3 text-sm font-bold text-bgAbyss shadow-[0_0_20px_rgba(34,211,238,0.6)] transition duration-150 ease-out hover:bg-white active:scale-[0.98] disabled:opacity-70"
            >
              {permissionStatus === 'requesting' ? 'Đang lấy GPS...' : 'Bật GPS / Dùng demo'}
            </button>
          </article>
        )}
      </div>

      {isPanelOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng bảng điều hướng"
            onClick={() => setIsPanelOpen(false)}
            className="absolute inset-0 z-[1400] bg-bgAbyss/65 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 top-0 z-[1500]">
            <SidebarContent
              onClose={() => setIsPanelOpen(false)}
              onUpgrade={onUpgrade}
              handleLocate={handleLocate}
              permissionStatus={permissionStatus}
              enrichedPois={enrichedPois}
              selectedPoi={selectedPoi}
              handleSelectPoi={(poi) => {
                handleSelectPoi(poi);
                setIsPanelOpen(false);
              }}
            />
          </div>
        </>
      )}

      <SharedAudioBar onUpgrade={onUpgrade} onToast={onToast} />
      <PoiBottomSheet poi={selectedPoi} onClose={() => setSearchParams({})} onUpgrade={onUpgrade} onToast={onToast} />
    </section>
  );
}
