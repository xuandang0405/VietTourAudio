export function LanguageModal({ open, value, onClose, onChange }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-2xl bg-white p-4">
        <h3 className="text-sm font-bold">Chon ngon ngu</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['vi', 'en'].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onChange(lang)}
              className={`rounded-lg border px-3 py-2 text-sm ${value === lang ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200'}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Dong</button>
      </div>
    </div>
  );
}
