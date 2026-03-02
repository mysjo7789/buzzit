import { MBTIAnswer, MBTIScores } from '../types/mbti'

/**
 * MBTI 계산 로직
 * 각 차원별 점수를 합산하여 최종 MBTI 타입 반환
 */
export function calculateMBTI(answers: MBTIAnswer[]): string {
  // 각 차원별 점수 초기화
  const scores: MBTIScores = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  }

  // 답변별로 점수 합산
  answers.forEach((answer) => {
    scores[answer.dimension] += answer.score
  })

  // MBTI 타입 결정
  // 양수면 첫 글자(E/S/T/J), 음수면 두번째 글자(I/N/F/P)
  const result =
    (scores.EI >= 0 ? 'E' : 'I') +
    (scores.SN >= 0 ? 'S' : 'N') +
    (scores.TF >= 0 ? 'T' : 'F') +
    (scores.JP >= 0 ? 'J' : 'P')

  return result
}

/**
 * 각 차원별 점수 퍼센트 계산
 * 결과 상세 페이지에서 활용 가능
 */
export function calculateScorePercentages(answers: MBTIAnswer[]): Record<string, number> {
  const scores: MBTIScores = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  }

  answers.forEach((answer) => {
    scores[answer.dimension] += answer.score
  })

  // 각 차원별 최대 점수는 4 (4문항 * 1점)
  const maxScore = 4

  return {
    E: Math.max(0, (scores.EI / maxScore) * 100),
    I: Math.max(0, (-scores.EI / maxScore) * 100),
    S: Math.max(0, (scores.SN / maxScore) * 100),
    N: Math.max(0, (-scores.SN / maxScore) * 100),
    T: Math.max(0, (scores.TF / maxScore) * 100),
    F: Math.max(0, (-scores.TF / maxScore) * 100),
    J: Math.max(0, (scores.JP / maxScore) * 100),
    P: Math.max(0, (-scores.JP / maxScore) * 100),
  }
}
