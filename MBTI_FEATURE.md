# 🧠 MBTI 성격 테스트 기능

## 📋 개요

Buzzit에 추가된 바이럴 MBTI 성격 테스트 기능입니다.

### 주요 특징

- ✅ **서버리스 아키텍처**: LocalStorage 기반, 백엔드 불필요
- ✅ **16개 질문**: 일상 시나리오 기반 (E/I, S/N, T/F, J/P 각 4문항)
- ✅ **16가지 유형**: 각 유형별 상세한 해석과 통계
- ✅ **진행 상황 저장**: 새로고침해도 이어서 진행 (24시간 유효)
- ✅ **공유 기능**: 카카오톡, 트위터, 페이스북, 링크 복사
- ✅ **실시간 통계**: 브라우저 내 테스트 결과 집계
- ✅ **반응형 디자인**: 모바일/태블릿/데스크톱 최적화

## 🚀 설치 및 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```bash
# Kakao SDK Configuration
VITE_KAKAO_JAVASCRIPT_KEY=your_kakao_javascript_key_here

# Site Configuration
VITE_SITE_URL=https://bzibzi.com
```

### 2. Kakao JavaScript Key 발급

1. [Kakao Developers](https://developers.kakao.com/console/app) 접속
2. 애플리케이션 생성 또는 선택
3. **앱 키** → **JavaScript 키** 복사
4. **플랫폼 설정** → **Web 플랫폼 등록** → 도메인 추가
5. `.env` 파일의 `VITE_KAKAO_JAVASCRIPT_KEY`에 붙여넣기

### 3. OG 이미지 생성 (선택 사항)

공유 시 더 나은 미리보기를 위해 유형별 OG 이미지를 생성할 수 있습니다.

```bash
# 브라우저에서 열기
open frontend/scripts/generate-og-images.html

# 또는 로컬 서버로 실행
cd frontend/scripts
python3 -m http.server 8000
# http://localhost:8000/generate-og-images.html 접속
```

이미지 생성 후 `frontend/public/` 디렉토리에 저장:
- `og-mbti-intj.png`
- `og-mbti-enfp.png`
- ... (16개 유형 모두)

## 📁 파일 구조

```
frontend/src/
├── pages/
│   ├── MBTIStartPage.tsx       # 시작 페이지
│   ├── MBTITestPage.tsx        # 테스트 진행
│   └── MBTIResultPage.tsx      # 결과 표시
├── components/mbti/
│   ├── QuestionCard.tsx        # 질문 카드
│   ├── ProgressBar.tsx         # 진행도 표시
│   ├── ResultCard.tsx          # 결과 카드
│   └── ShareButtons.tsx        # 공유 버튼
├── data/
│   ├── questions.ts            # 16개 질문
│   └── results.ts              # 16개 유형 해석
├── utils/
│   ├── mbtiCalculator.ts       # MBTI 계산
│   ├── mbtiStorage.ts          # LocalStorage 관리
│   ├── mbtiStats.ts            # 통계 관리
│   └── kakao.ts                # Kakao SDK 초기화
└── types/
    └── mbti.ts                 # 타입 정의
```

## 🎯 라우팅

- **시작**: `/mbti`
- **테스트**: `/mbti/test`
- **결과**: `/mbti/result?type=ENFP`

## 🎨 커스터마이징

### 질문 수정

`frontend/src/data/questions.ts` 파일을 수정:

```typescript
{
  id: 1,
  dimension: 'EI', // E/I, S/N, T/F, J/P 중 하나
  text: '질문 내용',
  optionA: {
    text: '선택지 A',
    description: '설명',
    score: 1 // E/S/T/J
  },
  optionB: {
    text: '선택지 B',
    description: '설명',
    score: -1 // I/N/F/P
  }
}
```

### 결과 해석 수정

`frontend/src/data/results.ts` 파일을 수정:

```typescript
ENFP: {
  type: 'ENFP',
  title: '활동가',
  subtitle: '자유로운 영혼',
  emoji: '🎉',
  traits: ['특징1', '특징2', ...],
  quote: '한마디 요약',
  compatible: ['INTJ', 'INFJ'],
  percentage: 8.1,
  rank: 12
}
```

## 💾 데이터 저장

### LocalStorage 키

- `mbti_answers`: 진행 중인 답변
- `mbti_timestamp`: 답변 저장 시간 (24시간 후 만료)
- `mbti_last_result`: 마지막 테스트 결과
- `mbti_global_stats`: 전체 통계 (브라우저별)

### 통계 초기화

브라우저 콘솔에서:

```javascript
localStorage.removeItem('mbti_global_stats')
```

## 🔧 개발

### 로컬 실행

```bash
cd frontend
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

### 테스트 플로우

1. `/mbti` 접속
2. "시작하기" 클릭
3. 16개 질문에 답변
4. 결과 확인
5. 공유 기능 테스트

## 📊 통계 기능

브라우저 내에서 테스트 결과를 자동으로 집계합니다:

- **총 테스트 수**: 이 브라우저에서 진행한 총 테스트 횟수
- **유형별 비율**: 각 유형이 나온 비율
- **가장 많은 유형**: 가장 많이 나온 MBTI 유형
- **희귀도 순위**: 16개 유형 중 희귀도 순위

## 🎯 SEO 최적화

### 동적 메타 태그

결과 페이지에서 자동으로 업데이트:

- `og:title`: "나는 활동가 ENFP!"
- `og:image`: `/og-mbti-enfp.png`
- `og:url`: 결과 페이지 URL

### 정적 메타 태그

시작 페이지용 기본 메타 태그 추가 권장:

```html
<meta property="og:title" content="MBTI 성격 테스트 | Buzzit" />
<meta property="og:description" content="2-3분만에 당신의 진짜 성격을 찾아보세요" />
```

## 🐛 트러블슈팅

### 카카오톡 공유가 안 돼요

1. `.env` 파일에 `VITE_KAKAO_JAVASCRIPT_KEY` 확인
2. Kakao Developers에서 Web 플랫폼 도메인 등록 확인
3. 브라우저 콘솔에서 `window.Kakao` 확인
4. HTTPS 환경인지 확인 (localhost는 예외)

### 진행 상황이 저장 안 돼요

1. 브라우저가 LocalStorage를 지원하는지 확인
2. 프라이빗 모드에서는 LocalStorage 제한될 수 있음
3. 24시간이 지나면 자동으로 만료됨

### OG 이미지가 안 보여요

1. `public/og-mbti-[type].png` 파일 존재 확인
2. 파일명이 소문자인지 확인 (예: `enfp`, not `ENFP`)
3. 캐시 초기화 (Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/))

## 📈 성과 지표

추적하면 좋은 지표:

- **시작율**: 시작 페이지 방문자 중 테스트 시작 비율
- **완료율**: 테스트 시작자 중 16번까지 완료한 비율
- **공유율**: 결과 페이지에서 공유 버튼 클릭 비율
- **재방문율**: 다시 하기 클릭 비율

Google Analytics로 추적:

```typescript
// 시작
gtag('event', 'mbti_start')

// 완료
gtag('event', 'mbti_complete', { result_type: 'ENFP' })

// 공유
gtag('event', 'mbti_share', { platform: 'kakao' })
```

## 🎉 완료!

이제 MBTI 테스트 기능이 완전히 작동합니다.

- `/mbti` 페이지 접속
- 헤더의 "🧠 MBTI" 버튼 클릭
- 홈페이지 상단 배너 클릭

## 📝 라이선스

이 기능은 재미와 자기이해를 위한 것으로, 공식 MBTI®와 무관합니다.
