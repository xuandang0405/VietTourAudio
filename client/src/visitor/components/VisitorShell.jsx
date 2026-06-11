import { AudioPlayerSheet } from '../../components/AudioPlayerSheet';

export function VisitorShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 min-[769px]:grid min-[769px]:place-items-center min-[769px]:p-6">
      <main className="relative mx-auto h-[100svh] min-h-[620px] w-full overflow-hidden bg-white shadow-none min-[769px]:h-[860px] min-[769px]:max-h-[calc(100vh-48px)] min-[769px]:max-w-[430px] min-[769px]:rounded-[2rem] min-[769px]:shadow-phone">
        {children}
        <AudioPlayerSheet />
      </main>
    </div>
  );
}
