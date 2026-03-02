import { MBTIQuestion } from '../types/mbti'

/**
 * MBTI 테스트 질문 16개
 * E/I 4개, S/N 4개, T/F 4개, J/P 4개
 */
export const questions: MBTIQuestion[] = [
  // E/I (외향성/내향성) - 4문항
  {
    id: 1,
    dimension: 'EI',
    text: '주말 아침, 친구가 갑자기 놀자고 연락하면?',
    optionA: {
      text: '"좋아! 어디로 갈까?"',
      description: '즉시 OK, 사람 만나는 게 에너지 충전',
      score: 1,
    },
    optionB: {
      text: '"음... 집에 있고 싶은데"',
      description: '혼자만의 시간이 더 필요함',
      score: -1,
    },
  },
  {
    id: 2,
    dimension: 'EI',
    text: '파티나 모임에 갔을 때 나는?',
    optionA: {
      text: '여기저기 돌아다니며 새로운 사람들과 대화',
      description: '새로운 사람 만나기를 즐김',
      score: 1,
    },
    optionB: {
      text: '친한 사람 1-2명이랑만 깊은 얘기',
      description: '소수의 친한 사람과 깊은 대화 선호',
      score: -1,
    },
  },
  {
    id: 3,
    dimension: 'EI',
    text: '하루 종일 사람들과 있었다면?',
    optionA: {
      text: '신나! 더 놀고 싶은데?',
      description: '사람들과 있으면 에너지가 충전됨',
      score: 1,
    },
    optionB: {
      text: '집 가서 혼자 쉬어야 배터리 충전됨',
      description: '혼자만의 시간이 필요함',
      score: -1,
    },
  },
  {
    id: 4,
    dimension: 'EI',
    text: '낯선 환경에 처음 갔을 때?',
    optionA: {
      text: '일단 사람들한테 말 걸어보기',
      description: '먼저 다가가서 대화 시도',
      score: 1,
    },
    optionB: {
      text: '조용히 관찰하면서 적응하기',
      description: '관찰 후 천천히 적응',
      score: -1,
    },
  },

  // S/N (감각형/직관형) - 4문항
  {
    id: 5,
    dimension: 'SN',
    text: '새로운 폰을 샀을 때 나는?',
    optionA: {
      text: '설명서 읽으면서 기능 하나하나 파악',
      description: '구체적이고 체계적으로 학습',
      score: 1,
    },
    optionB: {
      text: '일단 만져보면서 감으로 익히기',
      description: '직관적으로 탐색하며 학습',
      score: -1,
    },
  },
  {
    id: 6,
    dimension: 'SN',
    text: '친구가 고민 상담을 하면?',
    optionA: {
      text: '"정확히 언제 어떻게 된 건데?"',
      description: '구체적인 사실부터 파악',
      score: 1,
    },
    optionB: {
      text: '"아 그 마음 이해해..."',
      description: '전체적인 맥락과 감정 먼저',
      score: -1,
    },
  },
  {
    id: 7,
    dimension: 'SN',
    text: '여행 계획을 세울 때?',
    optionA: {
      text: '시간별 일정표 작성, 맛집 리스트, 교통편 예약',
      description: '구체적이고 상세한 계획',
      score: 1,
    },
    optionB: {
      text: '대충 어디 갈지만 정하고 그때그때 즉흥적으로',
      description: '큰 틀만 정하고 유연하게',
      score: -1,
    },
  },
  {
    id: 8,
    dimension: 'SN',
    text: '누군가 이야기를 할 때 나는?',
    optionA: {
      text: '"그래서 결론이 뭔데?"',
      description: '핵심부터 알고 싶음',
      score: 1,
    },
    optionB: {
      text: '"그게 무슨 의미일까?"',
      description: '숨은 뜻을 찾아봄',
      score: -1,
    },
  },

  // T/F (사고형/감정형) - 4문항
  {
    id: 9,
    dimension: 'TF',
    text: '친구가 실수로 약속을 까먹었을 때?',
    optionA: {
      text: '"다음부턴 알람 설정해둬"',
      description: '해결책 제시',
      score: 1,
    },
    optionB: {
      text: '"괜찮아, 다들 그럴 수 있지"',
      description: '공감과 위로',
      score: -1,
    },
  },
  {
    id: 10,
    dimension: 'TF',
    text: '영화를 보고 나서?',
    optionA: {
      text: '"스토리가 논리적으로 말이 안 됨"',
      description: '분석과 평가',
      score: 1,
    },
    optionB: {
      text: '"마지막에 너무 감동이야 ㅠㅠ"',
      description: '감정과 느낌',
      score: -1,
    },
  },
  {
    id: 11,
    dimension: 'TF',
    text: '팀 프로젝트에서 의견 충돌이 생기면?',
    optionA: {
      text: '"객관적으로 어떤 게 더 효율적인지 따져보자"',
      description: '논리와 효율 중심',
      score: 1,
    },
    optionB: {
      text: '"일단 모두의 의견을 들어보고 조율해보자"',
      description: '관계와 조화 중심',
      score: -1,
    },
  },
  {
    id: 12,
    dimension: 'TF',
    text: '친구가 "나 우울해..."라고 하면?',
    optionA: {
      text: '"왜? 무슨 일 있어?"',
      description: '원인 파악부터',
      score: 1,
    },
    optionB: {
      text: '"힘들구나... 내가 옆에 있을게"',
      description: '일단 공감',
      score: -1,
    },
  },

  // J/P (판단형/인식형) - 4문항
  {
    id: 13,
    dimension: 'JP',
    text: '아침에 일어나면 제일 먼저?',
    optionA: {
      text: '오늘 할 일 체크리스트 확인',
      description: '계획적이고 체계적',
      score: 1,
    },
    optionB: {
      text: '일단 침대에서 폰 보다가 마음 내킬 때 일어남',
      description: '즉흥적이고 유연함',
      score: -1,
    },
  },
  {
    id: 14,
    dimension: 'JP',
    text: '배달음식 주문할 때?',
    optionA: {
      text: '평소에 먹던 익숙한 메뉴 주문',
      description: '확실한 것 선호',
      score: 1,
    },
    optionB: {
      text: '"오늘은 뭐 먹지?" → 30분 고민 끝에 새로운 거 도전',
      description: '새로운 것 탐색',
      score: -1,
    },
  },
  {
    id: 15,
    dimension: 'JP',
    text: '방 청소를 할 때?',
    optionA: {
      text: '정해진 요일에 규칙적으로 청소',
      description: '규칙적이고 계획적',
      score: 1,
    },
    optionB: {
      text: '너무 더러워지면 그때 한 번에 대청소',
      description: '유연하고 즉흥적',
      score: -1,
    },
  },
  {
    id: 16,
    dimension: 'JP',
    text: '카톡 메시지가 왔을 때?',
    optionA: {
      text: '본 순간 바로 답장 (안 그러면 신경 쓰임)',
      description: '즉시 처리 선호',
      score: 1,
    },
    optionB: {
      text: '"나중에 답장해야지~" → (3일 후) "아 깜빡했다"',
      description: '나중에 처리',
      score: -1,
    },
  },
]
