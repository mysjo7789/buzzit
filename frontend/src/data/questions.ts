import { MBTIQuestion } from '../types/mbti'

/**
 * MBTI 테스트 질문 12개 (각 차원당 3개 - 홀수로 동점 방지)
 * E/I 3개, S/N 3개, T/F 3개, J/P 3개
 * text와 optionA/B.text는 i18n 키로 사용됨
 */
export const questions: MBTIQuestion[] = [
  // E/I (외향성/내향성) - 3문항
  {
    id: 1,
    dimension: 'EI',
    text: 'mbti.questions.1.text',
    optionA: {
      text: 'mbti.questions.1.optionA',
      description: '즉시 OK, 사람 만나는 게 에너지 충전',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.1.optionB',
      description: '혼자만의 시간이 더 필요함',
      score: -1,
    },
  },
  {
    id: 2,
    dimension: 'EI',
    text: 'mbti.questions.2.text',
    optionA: {
      text: 'mbti.questions.2.optionA',
      description: '새로운 사람 만나기를 즐김',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.2.optionB',
      description: '소수의 친한 사람과 깊은 대화 선호',
      score: -1,
    },
  },
  {
    id: 3,
    dimension: 'EI',
    text: 'mbti.questions.3.text',
    optionA: {
      text: 'mbti.questions.3.optionA',
      description: '사람들과 있으면 에너지가 충전됨',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.3.optionB',
      description: '혼자만의 시간이 필요함',
      score: -1,
    },
  },

  // S/N (감각형/직관형) - 3문항 (개선됨)
  {
    id: 4,
    dimension: 'SN',
    text: 'mbti.questions.4.text',
    optionA: {
      text: 'mbti.questions.4.optionA',
      description: '검증된 방법, 구체적 데이터 중심',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.4.optionB',
      description: '큰 그림, 새로운 가능성 탐색',
      score: -1,
    },
  },
  {
    id: 5,
    dimension: 'SN',
    text: 'mbti.questions.5.text',
    optionA: {
      text: 'mbti.questions.5.optionA',
      description: '실제 경험, 구체적 사실 선호',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.5.optionB',
      description: '미래 가능성, 아이디어 선호',
      score: -1,
    },
  },
  {
    id: 6,
    dimension: 'SN',
    text: 'mbti.questions.6.text',
    optionA: {
      text: 'mbti.questions.6.optionA',
      description: '단계별로 차근차근',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.6.optionB',
      description: '전체 개념 먼저, 자기 방식으로 응용',
      score: -1,
    },
  },

  // T/F (사고형/감정형) - 3문항 (개선됨)
  {
    id: 7,
    dimension: 'TF',
    text: 'mbti.questions.7.text',
    optionA: {
      text: 'mbti.questions.7.optionA',
      description: '상황 분석, 해결책 제시',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.7.optionB',
      description: '공감과 경청',
      score: -1,
    },
  },
  {
    id: 8,
    dimension: 'TF',
    text: 'mbti.questions.8.text',
    optionA: {
      text: 'mbti.questions.8.optionA',
      description: '논리적 분석',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.8.optionB',
      description: '가치관과 마음',
      score: -1,
    },
  },
  {
    id: 9,
    dimension: 'TF',
    text: 'mbti.questions.9.text',
    optionA: {
      text: 'mbti.questions.9.optionA',
      description: '원인 파악, 재발 방지',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.9.optionB',
      description: '기분 살피기, 격려',
      score: -1,
    },
  },

  // J/P (판단형/인식형) - 3문항
  {
    id: 10,
    dimension: 'JP',
    text: 'mbti.questions.10.text',
    optionA: {
      text: 'mbti.questions.10.optionA',
      description: '계획적이고 체계적',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.10.optionB',
      description: '즉흥적이고 유연함',
      score: -1,
    },
  },
  {
    id: 11,
    dimension: 'JP',
    text: 'mbti.questions.11.text',
    optionA: {
      text: 'mbti.questions.11.optionA',
      description: '확실한 것 선호',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.11.optionB',
      description: '새로운 것 탐색',
      score: -1,
    },
  },
  {
    id: 12,
    dimension: 'JP',
    text: 'mbti.questions.12.text',
    optionA: {
      text: 'mbti.questions.12.optionA',
      description: '규칙적이고 계획적',
      score: 1,
    },
    optionB: {
      text: 'mbti.questions.12.optionB',
      description: '유연하고 즉흥적',
      score: -1,
    },
  },
]
