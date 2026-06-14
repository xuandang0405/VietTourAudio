import { AudioPlayerSheet } from '../../components/AudioPlayerSheet';

export function VisitorShell({ children }) {
  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-bgAbyss text-textCrisp">
      <div className="ocean-bg" aria-hidden="true" />
      <main className="relative z-10 h-[100svh] w-full flex-1 overflow-hidden font-body">
        {children}
        <AudioPlayerSheet />
      </main>
    </div>
  );
}
