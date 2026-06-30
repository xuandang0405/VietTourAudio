import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useAudioStore } from '../stores/useAudioStore';
import { LanguageModal } from '../components/LanguageModal';

export function Settings() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const autoPlay = useAudioStore((s) => s.autoPlay);
  const setAutoPlay = useAudioStore((s) => s.setAutoPlay);
  const [openLang, setOpenLang] = useState(false);

  return (
    <section className="space-y-3 p-4">
      <h1 className="text-xl font-black">Cai dat</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs text-slate-500">Ngon ngu</p>
        <button type="button" onClick={() => setOpenLang(true)} className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold">
          {language.toUpperCase()}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <label className="flex items-center justify-between text-sm">
          <span>Tu dong phat khi vao geofence</span>
          <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
        </label>
      </div>

      <LanguageModal
        open={openLang}
        value={language}
        onClose={() => setOpenLang(false)}
        onChange={(lang) => {
          setLanguage(lang);
          setOpenLang(false);
        }}
      />
    </section>
  );
}
