export function VisitorShell({ children }) {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-100 isolate flex flex-col text-slate-900">
      <main className="relative z-10 h-full w-full flex-1 overflow-hidden font-body">
        {children}
      </main>
    </div>
  );
}

