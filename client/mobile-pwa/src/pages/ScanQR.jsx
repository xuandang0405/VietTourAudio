import { useEffect, useMemo, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Camera, QrCode, AlertTriangle, Keyboard, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { PermissionGuide } from '../components/PermissionGuide';
import { useAppStore } from '../stores/useAppStore';
import { saveTour, saveZones } from '../services/idb';

export function ScanQR() {
  try {
    return <ScanQRInner />;
  } catch (err) {
    console.error("ScanQR Render Error:", err, err.stack);
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl m-4 text-rose-700">
        <h3 className="font-bold">Lỗi hiển thị màn hình quét (Render Error)</h3>
        <p className="text-xs font-mono mt-1">{err?.message || String(err)}</p>
        <pre className="text-[10px] font-mono mt-2 overflow-auto bg-rose-100 p-2 rounded">{err?.stack}</pre>
      </div>
    );
  }
}

function ScanQRInner() {
  const navigate = useNavigate();
  const guestId = useAppStore((s) => s.guestId);
  const setSessionId = useAppStore((s) => s.setSessionId);
  const setQrToken = useAppStore((s) => s.setQrToken);
  
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState('');
  const [cameraDenied, setCameraDenied] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerId = useMemo(() => 'qr-reader', []);

  async function processToken(rawToken) {
    try {
      setError('');
      setIsProcessing(true);
      const token = rawToken?.trim();
      if (!token) {
        setIsProcessing(false);
        return;
      }
      
      const { data } = await api.post('/qr/scan', { token, guestId });
      setSessionId(data.session.id);
      setQrToken(token);
      localStorage.setItem('sessionId', data.session.id);
      await saveTour(data.tour);
      await saveZones(data.tour.id, data.zones || []);
      navigate(`/tour/${data.tour.id}`);
    } catch (e) {
      setError(e.message || 'Mã QR hoặc token không hợp lệ. Vui lòng kiểm tra lại.');
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    const scanner = new Html5Qrcode(scannerId);
    let mounted = true;

    // Wait a brief moment to ensure container is fully rendered in DOM
    const timer = setTimeout(() => {
      if (!mounted) return;
      
      const container = document.getElementById(scannerId);
      if (!container) {
        console.warn(`Container #${scannerId} not found in DOM`);
        return;
      }

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (!mounted) return;
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (e) {
            console.warn('Error stopping scanner on success:', e);
          }
          await processToken(decodedText);
        },
        () => {} // Ignore frame-by-frame errors
      ).catch((err) => {
        if (!mounted) return;
        console.error('Lỗi khởi động camera:', err);
        setCameraDenied(true);
        setCameraError(err?.message || String(err || 'Không thể truy cập camera.'));
      });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      try {
        if (scanner.isScanning) {
          scanner.stop().catch((err) => console.warn('Async stop error:', err));
        }
      } catch (err) {
        console.warn('Sync stop error:', err);
      }
      try {
        scanner.clear().catch((err) => console.warn('Async clear error:', err));
      } catch (err) {
        console.warn('Sync clear error:', err);
      }
    };
  }, [scannerId]);

  return (
    <section className="min-h-[calc(100svh-120px)] p-4 flex flex-col justify-between gap-6 bg-slate-50">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shadow-sm">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Quét QR khám phá</h1>
            <p className="text-xs text-slate-500 font-medium">Bắt đầu chuyến tham quan của bạn</p>
          </div>
        </div>

        {/* Scanner Container */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200/60 bg-slate-950 aspect-[4/3] flex flex-col items-center justify-center shadow-lg shadow-slate-100">
          <div id={scannerId} className="w-full h-full object-cover" />
          
          {/* Overlay scanning guide */}
          {!cameraDenied && !isProcessing && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-[220px] h-[220px] border-2 border-dashed border-teal-400 rounded-2xl bg-teal-500/5 animate-pulse" />
              <p className="mt-4 text-xs font-semibold text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow">
                Di chuyển camera đến mã QR của khu vực
              </p>
            </div>
          )}

          {/* Loading processing state */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold tracking-wide text-teal-400">Đang kích hoạt tour...</p>
            </div>
          )}
        </div>

        {/* Camera Error / Permission notifications */}
        {cameraDenied && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-slate-700 shadow-sm space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Không khởi tạo được Camera</h3>
                <p className="text-xs text-rose-600 mt-0.5 leading-relaxed font-medium">
                  {cameraError.includes('NotAllowedError') || cameraError.includes('Permission')
                    ? 'Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục.'
                    : `Chi tiết: ${cameraError}`}
                </p>
              </div>
            </div>

            {/* Practical troubleshooting steps */}
            <div className="border-t border-rose-100 pt-3 text-xs leading-relaxed text-slate-600 space-y-1.5 font-medium">
              <p className="font-semibold text-slate-700">Các bước khắc phục lỗi:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Đảm bảo bạn đang truy cập bằng kết nối bảo mật (<strong className="text-teal-600">HTTPS</strong>) hoặc chạy từ <strong className="text-teal-600">localhost</strong>.</li>
                <li>Mở Cài đặt trình duyệt → Quyền trang web → Camera → Cho phép trang web này sử dụng.</li>
                <li>Nếu đang dùng iPhone, thử mở bằng Safari. Nếu dùng Android, hãy mở bằng Chrome.</li>
              </ul>
            </div>
            
            <PermissionGuide type="camera" />
          </div>
        )}

        {/* Invalid Token Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-slate-700 shadow-sm">
            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lỗi kích hoạt</h3>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Keyboard className="h-4 w-4 text-teal-600" />
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nhập mã tham quan thủ công</label>
        </div>
        <div className="flex gap-2">
          <input
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            disabled={isProcessing}
            placeholder="Ví dụ: TOUR:1"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 font-semibold focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => processToken(manualToken)}
            disabled={isProcessing || !manualToken.trim()}
            className="rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 px-5 text-sm font-bold text-white shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 transition-all duration-200 min-w-[90px]"
          >
            Vào
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
