import { createContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, detectLocale, getSavedLocale, saveLocale } from '../i18n'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextType>({
  locale: defaultLocale,
  setLocale: () => {},
})

interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // 저장된 로케일 > 브라우저 언어 > 기본값 순서
    return getSavedLocale() || detectLocale()
  })

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    saveLocale(newLocale)
  }

  // 로케일 변경 시 HTML lang 속성 업데이트
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
