import { memo } from 'react';
import { useTranslation } from 'react-i18next';

function SidebarPoiCardComponent({ poi, active, onClick }) {
  const { t } = useTranslation();
  if (!poi) return null;
  const displayName = poi.stallName || poi.name || poi.title;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'glass-card group flex w-full items-center gap-3 p-2 text-left active:scale-[0.99]',
        active ? 'glass-card-active pl-3' : ''
      ].join(' ')}
    >
      {active && <span className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-oceanCyan to-electricBlue" />}
      {poi.image && (
        <img
          src={poi.image}
          alt={displayName}
          className="aspect-square w-16 flex-shrink-0 rounded-xl border border-glassBorder object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className={active ? 'truncate text-sm font-bold text-textCrisp' : 'truncate text-sm font-bold text-textCrisp group-hover:text-oceanCyan'}>
          {displayName}
        </p>
        <p className="mt-0.5 truncate text-xs font-medium text-textSeafoam">{poi.category}</p>
        <p className={poi.isInsideRadius ? 'mt-1 text-[11px] font-bold uppercase text-oceanCyan' : 'mt-1 text-[11px] font-bold uppercase text-textGhost'}>
          {poi.distanceLabel || poi.distanceHint || t('map.no_gps')}
        </p>
      </div>
      {poi.isInsideRadius && <span className="mr-1 h-2 w-2 flex-shrink-0 rounded-full bg-oceanCyan shadow-neon-cyan" />}
    </button>
  );
}

export const SidebarPoiCard = memo(SidebarPoiCardComponent);
