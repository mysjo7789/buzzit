// MBTI 테스트 관련 타입 정의

/**
 * MBTI 4가지 차원
 */
export type MBTIDimension = 'EI' | 'SN' | 'TF' | 'JP'

/**
 * 선택지 옵션
 */
export type MBTIOption = 'A' | 'B'

/**
 * 질문 옵션 데이터
 */
export interface QuestionOption {
  text: string
  description: string
  score: number // 1 (E/S/T/J) or -1 (I/N/F/P)
}

/**
 * 질문 데이터
 */
export interface MBTIQuestion {
  id: number
  dimension: MBTIDimension
  text: string
  optionA: QuestionOption
  optionB: QuestionOption
}

/**
 * 사용자 답변
 */
export interface MBTIAnswer {
  questionId: number
  selected: MBTIOption
  score: number
  dimension: MBTIDimension
}

/**
 * MBTI 결과 데이터
 */
export interface MBTIResult {
  type: string // e.g., "ENFP"
  title: string // e.g., "활동가"
  subtitle: string // e.g., "자유로운 영혼"
  emoji: string // e.g., "🎉"
  traits: string[] // 특징 리스트
  quote: string // 한마디 요약
  compatible: string[] // 잘 맞는 유형
  percentage: number // 전체 중 비율
  rank: number // 희귀도 순위 (1-16)
}

/**
 * MBTI 점수 집계
 */
export interface MBTIScores {
  EI: number
  SN: number
  TF: number
  JP: number
}
