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
  },
  {
    code: 'ja',
    label: 'JA',
    name: '日本語',
    speechCode: 'ja-JP'
  },
  {
    code: 'ko',
    label: 'KO',
    name: '한국어',
    speechCode: 'ko-KR'
  },
  {
    code: 'zh',
    label: 'ZH',
    name: '中文',
    speechCode: 'zh-CN'
  }
];

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      currentLanguage: 'vi',
      setLanguage: (language) => set({ currentLanguage: language }),
      toggleLanguage: () => {
        const currentIndex = languages.findIndex((language) => language.code === get().currentLanguage);
        const nextLanguage = languages[(currentIndex + 1) % languages.length];
        set({ currentLanguage: nextLanguage.code });
      },
      getLanguageMeta: () => languages.find((language) => language.code === get().currentLanguage) ?? languages[0]
    }),
    {
      name: 'vta-language',
      storage: createJSONStorage(() => window.localStorage)
    }
  )
);
