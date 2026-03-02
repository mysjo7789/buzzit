import type { Locale } from '../i18n'

// MyMemory Translation API (무료, API key 불필요)
// 제한: 하루 500 요청 (IP당)
const TRANSLATE_API_URL = 'https://api.mymemory.translated.net/get'

// 번역 캐시 (메모리)
const translationCache = new Map<string, string>()

// 로컬스토리지 캐시 키
const CACHE_KEY = 'translation_cache'
const CACHE_VERSION = 'v1'

// 로컬스토리지에서 캐시 로드
function loadCache(): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      if (data.version === CACHE_VERSION) {
        Object.entries(data.translations).forEach(([key, value]) => {
          translationCache.set(key, value as string)
        })
      }
    }
  } catch (error) {
    console.warn('Failed to load translation cache:', error)
  }
}

// 로컬스토리지에 캐시 저장
function saveCache(): void {
  try {
    const data = {
      version: CACHE_VERSION,
      translations: Object.fromEntries(translationCache),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save translation cache:', error)
  }
}

// 초기화 시 캐시 로드
if (typeof window !== 'undefined') {
  loadCache()
}

/**
 * 텍스트 번역 (MyMemory API 사용)
 * @param text 번역할 텍스트
 * @param targetLang 목표 언어 (en, ja 등)
 * @param sourceLang 원본 언어 (기본: ko)
 * @returns 번역된 텍스트
 */
export async function translateText(
  text: string,
  targetLang: Locale,
  sourceLang: Locale = 'ko'
): Promise<string> {
  // 동일 언어면 그대로 반환
  if (targetLang === sourceLang) return text

  // 빈 문자열 처리
  if (!text.trim()) return text

  // 캐시 확인
  const cacheKey = `${sourceLang}:${targetLang}:${text}`
  const cached = translationCache.get(cacheKey)
  if (cached) return cached

  try {
    // API 호출
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    })

    const response = await fetch(`${TRANSLATE_API_URL}?${params}`)
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText

      // 캐시에 저장
      translationCache.set(cacheKey, translated)
      saveCache()

      return translated
    } else {
      console.warn('Translation failed:', data)
      return text // 실패 시 원본 반환
    }
  } catch (error) {
    console.error('Translation error:', error)
    return text // 에러 시 원본 반환
  }
}

/**
 * 여러 텍스트를 배치로 번역 (순차 처리, 딜레이 포함)
 * @param texts 번역할 텍스트 배열
 * @param targetLang 목표 언어
 * @param sourceLang 원본 언어
 * @param delay 요청 간 딜레이 (ms, 기본 500ms)
 * @returns 번역된 텍스트 배열
 */
export async function translateBatch(
  texts: string[],
  targetLang: Locale,
  sourceLang: Locale = 'ko',
  delay: number = 500
): Promise<string[]> {
  const results: string[] = []

  for (let i = 0; i < texts.length; i++) {
    const translated = await translateText(texts[i], targetLang, sourceLang)
    results.push(translated)

    // 마지막 항목이 아니면 딜레이
    if (i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return results
}

/**
 * 번역 캐시 초기화
 */
export function clearTranslationCache(): void {
  translationCache.clear()
  localStorage.removeItem(CACHE_KEY)
}
