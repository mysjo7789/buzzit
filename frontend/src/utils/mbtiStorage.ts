import { MBTIAnswer, MBTIResult } from '../types/mbti'

const STORAGE_KEYS = {
  ANSWERS: 'mbti_answers',
  TIMESTAMP: 'mbti_timestamp',
  LAST_RESULT: 'mbti_last_result',
} as const

// 24시간 (밀리초)
const EXPIRY_TIME = 24 * 60 * 60 * 1000

/**
 * 진행 중인 답변 저장
 */
export const saveProgress = (answers: MBTIAnswer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers))
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString())
  } catch (error) {
    console.error('Failed to save progress:', error)
  }
}

/**
 * 저장된 진행 상황 불러오기
 * 24시간 지난 데이터는 자동 삭제
 */
export const loadProgress = (): MBTIAnswer[] | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ANSWERS)
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP)

    if (!saved || !timestamp) {
      return null
    }

    // 24시간 지난 데이터는 무효
    const savedTime = parseInt(timestamp, 10)
    if (Date.now() - savedTime > EXPIRY_TIME) {
      clearProgress()
      return null
    }

    return JSON.parse(saved) as MBTIAnswer[]
  } catch (error) {
    console.error('Failed to load progress:', error)
    return null
  }
}

/**
 * 진행 상황 초기화
 */
export const clearProgress = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS)
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP)
  } catch (error) {
    console.error('Failed to clear progress:', error)
  }
}

/**
 * 최종 결과 저장
 */
export const saveResult = (result: MBTIResult): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_RESULT, JSON.stringify(result))
  } catch (error) {
    console.error('Failed to save result:', error)
  }
}

/**
 * 마지막 결과 불러오기
 */
export const loadLastResult = (): MBTIResult | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_RESULT)
    if (!saved) {
      return null
    }
    return JSON.parse(saved) as MBTIResult
  } catch (error) {
    console.error('Failed to load last result:', error)
    return null
  }
}

/**
 * 저장된 진행 상황이 있는지 확인
 */
export const hasProgress = (): boolean => {
  const progress = loadProgress()
  return progress !== null && progress.length > 0
}
