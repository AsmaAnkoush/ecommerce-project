import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import en from '../i18n/en.json'
import ar from '../i18n/ar.json'

const dicts = { en, ar }
const STORAGE_KEY = 'iwear_lang'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  /**
   * Default language: Arabic.
   * - First load (no saved value)        → 'ar'
   * - Saved value is 'en' or 'ar'        → use it
   * - Saved value is corrupted / unknown → fall back to 'ar'
   */
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved === 'en' || saved === 'ar' ? saved : 'ar'
    } catch {
      return 'ar'
    }
  })

  const isFirstRun = useRef(true)

  /* Apply <html dir>/<html lang>, persist to localStorage, and play a soft
     fade animation when the language is switched (skipped on first mount). */
  useEffect(() => {
    const html = document.documentElement
    html.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    html.lang = lang
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }

    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    html.classList.add('lang-changing')
    const id = setTimeout(() => html.classList.remove('lang-changing'), 320)
    return () => clearTimeout(id)
  }, [lang])

  const setLang = useCallback((next) => {
    if (next === 'en' || next === 'ar') setLangState(next)
  }, [])

  const toggle = useCallback(() => {
    setLangState(prev => prev === 'ar' ? 'en' : 'ar')
  }, [])

  /**
   * t('nav.home')  → looks up dicts[lang].nav.home
   * Falls back to English, then returns the key itself.
   */
  const t = useCallback((key) => {
    const parts = key.split('.')
    const resolve = (dict) => {
      let val = dict
      for (const p of parts) { val = val?.[p] }
      return val
    }
    return resolve(dicts[lang]) ?? resolve(dicts['en']) ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
