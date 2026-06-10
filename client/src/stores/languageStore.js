import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const languages = [
  {
    code: 'vi',
    label: 'VI',
    name: 'Tiếng Việt',
    speechCode: 'vi-VN'
  },
  {
    code: 'en',
    label: 'EN',
    name: 'English',
    speechCode: 'en-US'
  }
];

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      currentLanguage: 'vi',
      setLanguage: (language) => set({ currentLanguage: language }),
      toggleLanguage: () => {
        set({ currentLanguage: get().currentLanguage === 'vi' ? 'en' : 'vi' });
      },
      getLanguageMeta: () => languages.find((language) => language.code === get().currentLanguage) ?? languages[0]
    }),
    {
      name: 'vta-language',
      storage: createJSONStorage(() => window.localStorage)
    }
  )
);
