import { ExternalLink, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getZoneQrValue } from '../data/zones.js';

function ZoneQrCard({ zone, compact = false }) {
  const qrValue = getZoneQrValue(zone);

  return (
    <article className={compact ? 'zone-qr-card compact' : 'zone-qr-card'}>
      <div className="zone-qr-header">
        <span><QrCode size={16} />QR khu vực</span>
        <strong>{zone.qrCode}</strong>
      </div>
      <div className="zone-qr-box" aria-label={`Mã QR riêng của ${zone.name}`}>
        <QRCodeSVG
          value={qrValue}
          size={compact ? 92 : 132}
          bgColor="#ffffff"
          fgColor="#0f3b5f"
          level="M"
          includeMargin={false}
        />
      </div>
      <a className="zone-qr-link" href={zone.qrPath}>
        <ExternalLink size={15} />
        {zone.qrPath}
      </a>
    </article>
  );
}

export default ZoneQrCard;
