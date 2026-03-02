/**
 * MBTI 통계 관리
 * LocalStorage에 모든 사용자의 결과를 익명으로 저장
 */

const STATS_KEY = 'mbti_global_stats'

interface MBTIStats {
  [type: string]: number // 각 유형별 카운트
}

/**
 * 결과 기록 추가
 */
export const recordResult = (type: string): void => {
  try {
    const stats = getStats()
    stats[type] = (stats[type] || 0) + 1
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('Failed to record result:', error)
  }
}

/**
 * 통계 조회
 */
export const getStats = (): MBTIStats => {
  try {
    const saved = localStorage.getItem(STATS_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch (error) {
    console.error('Failed to get stats:', error)
    return {}
  }
}

/**
 * 총 테스트 횟수
 */
export const getTotalTests = (): number => {
  const stats = getStats()
  return Object.values(stats).reduce((sum, count) => sum + count, 0)
}

/**
 * 가장 많은 유형
 */
export const getMostCommonType = (): { type: string; count: number; percentage: number } | null => {
  const stats = getStats()
  const total = getTotalTests()

  if (total === 0) {
    return null
  }

  let maxType = ''
  let maxCount = 0

  Object.entries(stats).forEach(([type, count]) => {
    if (count > maxCount) {
      maxType = type
      maxCount = count
    }
  })

  return {
    type: maxType,
    count: maxCount,
    percentage: (maxCount / total) * 100,
  }
}

/**
 * 가장 희귀한 유형
 */
export const getRarestType = (): { type: string; count: number; percentage: number } | null => {
  const stats = getStats()
  const total = getTotalTests()

  if (total === 0) {
    return null
  }

  // 기록된 유형 중 가장 적은 것
  let minType = ''
  let minCount = Infinity

  Object.entries(stats).forEach(([type, count]) => {
    if (count < minCount) {
      minType = type
      minCount = count
    }
  })

  if (minCount === Infinity) {
    return null
  }

  return {
    type: minType,
    count: minCount,
    percentage: (minCount / total) * 100,
  }
}

/**
 * 특정 유형의 통계
 */
export const getTypeStats = (
  type: string
): { count: number; percentage: number; rank: number } | null => {
  const stats = getStats()
  const total = getTotalTests()

  if (total === 0) {
    return null
  }

  const count = stats[type] || 0
  const percentage = (count / total) * 100

  // 순위 계산 (많은 순)
  const sorted = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .map(([t]) => t)
  const rank = sorted.indexOf(type) + 1

  return {
    count,
    percentage,
    rank: rank || 17, // 기록 없으면 최하위
  }
}

/**
 * 전체 통계 리스트 (정렬된)
 */
export const getAllStats = (): Array<{
  type: string
  count: number
  percentage: number
  rank: number
}> => {
  const stats = getStats()
  const total = getTotalTests()

  if (total === 0) {
    return []
  }

  return Object.entries(stats)
    .map(([type, count], _index, arr) => ({
      type,
      count,
      percentage: (count / total) * 100,
      rank: arr.filter(([, c]) => c > count).length + 1,
    }))
    .sort((a, b) => b.count - a.count)
}
