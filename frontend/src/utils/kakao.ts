/**
 * Kakao SDK 초기화 및 관리
 */

declare global {
  interface Window {
    Kakao: any
  }
}

let isInitialized = false

/**
 * Kakao SDK 초기화
 */
export const initKakao = (): boolean => {
  if (isInitialized) {
    return true
  }

  if (typeof window === 'undefined' || !window.Kakao) {
    console.warn('Kakao SDK is not loaded')
    return false
  }

  try {
    const kakaoKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY

    if (!kakaoKey || kakaoKey === 'your_kakao_javascript_key_here') {
      console.warn(
        'Kakao JavaScript Key is not set. Please set VITE_KAKAO_JAVASCRIPT_KEY in .env file'
      )
      return false
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoKey)
      console.log('Kakao SDK initialized')
    }

    isInitialized = true
    return true
  } catch (error) {
    console.error('Failed to initialize Kakao SDK:', error)
    return false
  }
}

/**
 * Kakao SDK가 사용 가능한지 확인
 */
export const isKakaoAvailable = (): boolean => {
  return typeof window !== 'undefined' && window.Kakao && isInitialized
}

/**
 * Kakao 인스턴스 가져오기
 */
export const getKakao = () => {
  if (!isKakaoAvailable()) {
    throw new Error('Kakao SDK is not available')
  }
  return window.Kakao
}
