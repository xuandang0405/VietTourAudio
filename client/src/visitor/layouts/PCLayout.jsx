import { SatelliteDish } from 'lucide-react';
import { DevGpsPanel } from '../components/DevGpsPanel';
import { LeafletMap } from '../components/LeafletMap';
import { PoiBottomSheet } from '../components/PoiBottomSheet';
import { SharedAudioBar } from '../components/SharedAudioBar';
import { SidebarContent } from '../components/SidebarContent';

export function PCLayout({
  searchParams,
  setSearchParams,
  selectedPoi,
  enrichedPois = [],
  position,
  permissionStatus,
  isFakeMode,
  handleSelectPoi,
  handleLocate,
  onUpgrade,
  onToast
}) {
  return (
    <section className="relative flex h-[100vh] min-h-[100vh] w-full overflow-hidden bg-transparent">
      <aside className="relative z-[1300] h-full w-[300px] flex-shrink-0">
        <SidebarContent
          onUpgrade={onUpgrade}
          handleLocate={handleLocate}
          permissionStatus={permissionStatus}
          isFakeMode={isFakeMode}
          enrichedPois={enrichedPois}
          selectedPoi={selectedPoi}
          handleSelectPoi={handleSelectPoi}
        />
      </aside>

      <div className="relative flex h-full flex-1 flex-col">
        <div className="relative flex-1 pb-[80px]">
          <div className="absolute inset-0">
            <LeafletMap selectedPoi={selectedPoi} enrichedPois={enrichedPois} position={position} onSelectPoi={handleSelectPoi} />
          </div>

          {(isFakeMode || searchParams.get('debug') === 'gps') && <DevGpsPanel pois={enrichedPois} onToast={onToast} />}

          {!position && (
            <article className="glass-card absolute left-6 right-6 top-6 z-[1200] mx-auto max-w-md p-4 text-center">
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

        <SharedAudioBar onUpgrade={onUpgrade} onToast={onToast} />
        <PoiBottomSheet poi={selectedPoi} onClose={() => setSearchParams({})} onUpgrade={onUpgrade} onToast={onToast} />
      </div>
    </section>
  );
}
