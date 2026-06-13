export function Toast({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-4 right-4 top-5 z-[1700] rounded-2xl border border-glassBorder bg-bgSurface/92 px-4 py-3 text-center text-sm font-bold text-textCrisp shadow-2xl shadow-black/35 backdrop-blur-xl animate-slide-up">
      {message}
    </div>
  );
}
