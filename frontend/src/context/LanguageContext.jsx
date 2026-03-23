import { createContext, useContext, useState, useEffect } from 'react'
import en from '../i18n/en.json'
import ar from '../i18n/ar.json'

const translations = { en, ar }
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'en')

  const setLang = (newLang) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }

  useEffect(() => {
    const isRTL = lang === 'ar'
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  // Supports dot-notation keys like "nav.home"
  const t = (key) => {
    const parts = key.split('.')
    let val = translations[lang]
    for (const part of parts) {
      val = val?.[part]
    }
    return val ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
