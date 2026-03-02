import { useContext } from 'react'
import { LocaleContext } from '../contexts/LocaleContext'
import { translations } from '../i18n'

type TranslationKey = string
type TranslationParams = Record<string, string | number>

/**
 * 중첩된 객체에서 키로 값 가져오기
 * 예: get(obj, 'mbti.start.title')
 */
function get(obj: any, path: string): string {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path // 키를 찾지 못하면 키 자체를 반환
    }
  }

  return typeof result === 'string' ? result : path
}

/**
 * 템플릿 문자열 치환
 * 예: interpolate('Hello {{name}}', { name: 'World' }) => 'Hello World'
 */
function interpolate(text: string, params?: TranslationParams): string {
  if (!params) return text

  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match
  })
}

export function useTranslation() {
  const { locale, setLocale } = useContext(LocaleContext)

  /**
   * 번역 키로 텍스트 가져오기
   * @param key 번역 키 (예: 'mbti.start.title')
   * @param params 템플릿 파라미터 (선택)
   * @returns 번역된 텍스트
   */
  const t = (key: TranslationKey, params?: TranslationParams): string => {
    const text = get(translations[locale], key)
    return interpolate(text, params)
  }

  return {
    t,
    locale,
    setLocale,
  }
}
