import { useUserStore } from '../features/auth/stores/userStore';

export function useLanguage() {
  const language = useUserStore((state) => state.preferences.language);
  const setPreferences = useUserStore((state) => state.setPreferences);

  return {
    language,
    setLanguage: (nextLanguage) => setPreferences({ language: nextLanguage })
  };
}
