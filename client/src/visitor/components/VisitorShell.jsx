export function VisitorShell({ children }) {
  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-slate-50 text-slate-900">
      <main className="relative z-10 h-[100svh] w-full flex-1 overflow-hidden font-body">
        {children}
      </main>
    </div>
  );
}

