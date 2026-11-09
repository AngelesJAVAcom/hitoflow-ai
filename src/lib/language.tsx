"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { englishMessages, spanishMessages, type TranslationKey } from "@/lib/translations";

type Language = "en" | "es";
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "hitoflow-language";
const LANGUAGE_EVENT = "hitoflow-language-change";
const subscribe = (onStoreChange: () => void) => {
  window.addEventListener(LANGUAGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(LANGUAGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};
const getSnapshot = (): Language => window.localStorage.getItem(STORAGE_KEY) === "es" ? "es" : "en";
const getServerSnapshot = (): Language => "en";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }, []);
  const t = useCallback((key: TranslationKey, values?: Record<string, string | number>) => {
    let message: string = language === "en" ? englishMessages[key] : spanishMessages[key];
    for (const [name, value] of Object.entries(values ?? {})) message = message.replaceAll(`{${name}}`, String(value));
    return message;
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
