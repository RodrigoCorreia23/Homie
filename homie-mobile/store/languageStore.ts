import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const LANG_KEY = 'homie_language';

export type Language = 'pt' | 'en';

async function saveLang(lang: Language) {
  if (Platform.OS === 'web') {
    localStorage.setItem(LANG_KEY, lang);
  } else {
    await SecureStore.setItemAsync(LANG_KEY, lang);
  }
}

async function loadLang(): Promise<Language> {
  try {
    if (Platform.OS === 'web') {
      return (localStorage.getItem(LANG_KEY) as Language) || 'pt';
    }
    const val = await SecureStore.getItemAsync(LANG_KEY);
    return (val as Language) || 'pt';
  } catch {
    return 'pt';
  }
}

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  loadLang: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: 'pt',
  setLang: (lang) => {
    saveLang(lang);
    set({ lang });
  },
  toggleLang: () => {
    const newLang = get().lang === 'pt' ? 'en' : 'pt';
    saveLang(newLang);
    set({ lang: newLang });
  },
  loadLang: async () => {
    const lang = await loadLang();
    set({ lang });
  },
}));
