import ko from './locales/ko.json'
import en from './locales/en.json'
import ja from './locales/ja.json'

export type Locale = 'ko' | 'en' | 'ja'

export const translations = {
  ko,
  en,
  ja,
}

export const defaultLocale: Locale = 'ko'

export const locales: Locale[] = ['ko', 'en', 'ja']

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

// 브라우저 언어에서 지원하는 로케일 감지
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  const browserLang = navigator.language.toLowerCase()

  if (browserLang.startsWith('ko')) return 'ko'
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('en')) return 'en'

  return defaultLocale
}

// 로컬스토리지에서 저장된 로케일 가져오기
export function getSavedLocale(): Locale | null {
  if (typeof window === 'undefined') return null

  const saved = localStorage.getItem('locale')
  if (saved && locales.includes(saved as Locale)) {
    return saved as Locale
  }

  return null
}

// 로케일 저장
export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('locale', locale)
}
