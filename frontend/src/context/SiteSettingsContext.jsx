import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getSettings } from '../api/adminApi'

const DEFAULT_SETTINGS = {
  siteName: 'IWEAR',
  logoUrl: '/images/iwear-logo.jpg',
  description: 'بوتيك أزياء راقية — كوليكشنات حصرية لكل موسم',
  contactWhatsApp: '+972594828117',
  contactPhone: '',
  contactEmail: '',
  address: 'فلسطين',
  activeSeason: 'SUMMER',
}

const SiteSettingsContext = createContext({ ...DEFAULT_SETTINGS, refresh: () => {} })

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const refresh = useCallback(() => {
    return getSettings()
      .then(res => {
        const s = res.data.data
        setSettings({
          siteName:        s.siteName        || DEFAULT_SETTINGS.siteName,
          logoUrl:         s.logoUrl         || '',
          description:     s.description     || DEFAULT_SETTINGS.description,
          contactWhatsApp: s.contactWhatsApp || DEFAULT_SETTINGS.contactWhatsApp,
          contactPhone:    s.contactPhone    || '',
          contactEmail:    s.contactEmail    || '',
          address:         s.address         || '',
          activeSeason:    s.activeSeason    || 'SUMMER',
        })
      })
      .catch(() => {/* use defaults */})
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <SiteSettingsContext.Provider value={{ ...settings, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
