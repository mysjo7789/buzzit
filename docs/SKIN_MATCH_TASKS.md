# AI 피부 닮은꼴 테스트 - 로컬 개발 태스크

> 로컬 환경에서 전체 기능을 테스트할 수 있도록 단계별로 정의
> 경로: `/tests/skin-match`

---

## Phase 0: 연예인 이미지 수집 및 준비

### 0.1 이미지 검색 및 다운로드
- [ ] 좋은 피부 연예인 이미지 12장 다운로드
  - 여자: 장원영, 카리나, 설윤, 민지(뉴진스), 제니(블랙핑크), 장규리
  - 남자: 차은우, 로운, 송강, 박보검, 정해인, 변우석
- [ ] 폭탄 멤버 이미지 5장 다운로드
  - 황정민, 정종철(옥동자), 박명수, 유해진, 김종국
- [ ] 구글 검색으로 고화질 프로필/화보 사진 선정
- [ ] 저장 경로: `frontend/public/images/skin-match/{id}.jpg`

### 0.2 이미지 후처리
- [ ] 전체 이미지 400x400px 리사이즈 (정사각형 크롭)
- [ ] JPEG 품질 85%로 압축
- [ ] 파일명 규칙: `{celebrity_id}.jpg`
  - 예: `wonyoung.jpg`, `karina.jpg`, `hwang_jm.jpg`
- [ ] 리사이즈 결과 확인 (17장 모두 400x400 검증)

### 0.3 이미지 파일 목록

| # | ID | 이름 | 타입 | 파일명 |
|---|-----|------|------|--------|
| 1 | wonyoung | 장원영 | good | `wonyoung.jpg` |
| 2 | karina | 카리나 | good | `karina.jpg` |
| 3 | sullyoon | 설윤 | good | `sullyoon.jpg` |
| 4 | minji | 민지 | good | `minji.jpg` |
| 5 | jennie | 제니 | good | `jennie.jpg` |
| 6 | gyuri | 장규리 | good | `gyuri.jpg` |
| 7 | chaeunwoo | 차은우 | good | `chaeunwoo.jpg` |
| 8 | rowoon | 로운 | good | `rowoon.jpg` |
| 9 | songkang | 송강 | good | `songkang.jpg` |
| 10 | parkbogum | 박보검 | good | `parkbogum.jpg` |
| 11 | junghaein | 정해인 | good | `junghaein.jpg` |
| 12 | byeonwooseok | 변우석 | good | `byeonwooseok.jpg` |
| 13 | hwang_jm | 황정민 | bomb | `hwang_jm.jpg` |
| 14 | jung_jc | 정종철 | bomb | `jung_jc.jpg` |
| 15 | park_ms | 박명수 | bomb | `park_ms.jpg` |
| 16 | yoo_hj | 유해진 | bomb | `yoo_hj.jpg` |
| 17 | kim_jk | 김종국 | bomb | `kim_jk.jpg` |

---

## Phase 1: 데이터 설계

### 1.1 연예인 결과 데이터 파일 생성
- [ ] `frontend/src/data/skinMatchResults.ts` 생성
- [ ] 17명 전원 데이터 입력 (id, name, nameEn, type, title, description, emoji, imagePath)
- [ ] TypeScript 타입 정의 (`SkinMatchResult` 인터페이스)

### 1.2 결과 타입 매핑
- [ ] 좋은 피부 타입 6종 → 연예인 12명에 배정
  - 아이돌 피부 타입 / 모델 피부 타입 / 글래스 스킨 타입
  - 클린 스킨 타입 / 투명 피부 타입 / 베이비 스킨 타입
- [ ] 폭탄 타입 5종 → 폭탄 멤버 5명에 배정
  - 야생 피부 타입 / 술톤 피부 타입 / 스트레스 피부 타입
  - 태닝 피부 타입 / 거친 피부 타입

### 1.3 확률 로직
- [ ] 결과 선택 확률 정의 (good 80% / bomb 20%)
- [ ] 이미지 해시 기반 결정론적 결과 선택 알고리즘 구현

---

## Phase 2: 백엔드 로컬 환경 구축

### 2.1 의존성 설치
- [ ] `pyproject.toml`에 추가
  ```
  opencv-python-headless
  mediapipe
  numpy
  ```
- [ ] `uv sync` 또는 `pip install` 로 로컬 설치
- [ ] 설치 확인: `python -c "import cv2; import mediapipe; print('OK')"`

### 2.2 피부 분석 모듈 구현
- [ ] `backend/core/skin_match/` 디렉토리 생성
- [ ] `backend/core/skin_match/__init__.py`
- [ ] `backend/core/skin_match/detector.py` - 얼굴 검출 (MediaPipe)
- [ ] `backend/core/skin_match/extractor.py` - 피부 영역 추출
- [ ] `backend/core/skin_match/analyzer.py` - 피부 Feature 계산
  - brightness, redness, texture, smoothness, tone_uniformity
- [ ] `backend/core/skin_match/celeb_data.py` - 연예인 피부 Feature 기준값
- [ ] `backend/core/skin_match/matcher.py` - 유사도 비교 + 결과 선택

### 2.3 API 엔드포인트
- [ ] `POST /api/skin-match` 엔드포인트 추가
- [ ] multipart/form-data 이미지 수신
- [ ] 이미지 유효성 검증 (크기, 포맷, 해상도)
- [ ] 에러 응답 구현 (no_face, too_dark, too_blurry, invalid_format)
- [ ] 정상 응답: `{ result_id, name, title, type, share_text }`

### 2.4 로컬 서버 실행 확인
- [ ] `uvicorn backend.main:app --reload --port 8000`
- [ ] curl로 API 테스트
  ```bash
  curl -X POST http://localhost:8000/api/skin-match \
    -F "image=@test_selfie.jpg"
  ```
- [ ] 정상 응답 확인
- [ ] 에러 케이스 확인 (얼굴 없는 이미지, 어두운 이미지 등)

---

## Phase 3: 프론트엔드 로컬 개발

### 3.1 라우팅 추가
- [ ] `frontend/src/App.tsx`에 라우트 추가
  - `/tests/skin-match` → SkinMatchTest
  - `/tests/skin-match/result/:resultId` → SkinMatchResult

### 3.2 랜딩 + 업로드 페이지
- [ ] `frontend/src/pages/SkinMatchTest.tsx` 생성
- [ ] 헤딩, 설명, 개인정보 안내 텍스트
- [ ] 사진 업로드 버튼 (모바일: 카메라/갤러리, PC: 파일선택)
- [ ] 이미지 미리보기

### 3.3 이미지 처리 유틸
- [ ] `frontend/src/utils/imageProcessor.ts` 생성
- [ ] 클라이언트 리사이즈 (최대 1080px)
- [ ] JPEG 압축 (quality 0.8)
- [ ] Canvas API 기반 처리

### 3.4 로딩 화면
- [ ] 분석 중 스피너 + "AI 피부 분석 중..." 텍스트
- [ ] 1~2초 로딩 UX

### 3.5 결과 페이지
- [ ] `frontend/src/pages/SkinMatchResult.tsx` 생성
- [ ] 결과 카드 (이모지 + 타입 이름 + 연예인 이름 + 이미지)
- [ ] 연예인 이미지 표시 (`/images/skin-match/{id}.jpg`)
- [ ] 결과 설명 텍스트

### 3.6 에러 화면
- [ ] 얼굴 미검출 / 어두움 / 흐림 / 네트워크 에러 분기
- [ ] 재시도 버튼

### 3.7 API 연동
- [ ] `frontend/src/utils/skinMatchApi.ts` 생성
- [ ] `POST /api/skin-match` 호출 (FormData)
- [ ] 로컬 개발 시 프록시 설정 (`vite.config.ts`에 `/api` → `localhost:8000`)
- [ ] 에러 파싱 및 분기

### 3.8 로컬 프론트 실행 확인
- [ ] `cd frontend && npm run dev`
- [ ] `http://localhost:3000/tests/skin-match` 접속
- [ ] 사진 업로드 → 로딩 → 결과 표시 전체 플로우 확인
- [ ] 에러 케이스 UI 확인

---

## Phase 4: 공유 기능

### 4.1 공유 유틸
- [ ] `frontend/src/utils/skinMatchShare.ts` 생성
- [ ] 공유 텍스트 생성 함수

### 4.2 공유 버튼 구현
- [ ] 카카오톡 공유 (기존 MBTI 패턴 참고)
- [ ] 트위터 / 페이스북 공유
- [ ] 링크 복사 (클립보드)
- [ ] "친구도 테스트" 버튼

### 4.3 결과 이미지 생성
- [ ] html2canvas 또는 Canvas API로 결과 카드 캡처
- [ ] 이미지 다운로드 기능

---

## Phase 5: 사이트 통합

### 5.1 진입점 배치
- [ ] MBTI 테스트 아래에 카드 형태로 노출
- [ ] "다른 테스트도 해보세요" 영역 추가

### 5.2 다국어 (i18n)
- [ ] 한국어 / 영어 번역 키 추가
- [ ] 연예인 이름 영문 매핑

---

## Phase 6: 로컬 통합 테스트

### 6.1 백엔드 + 프론트 동시 실행
- [ ] 터미널 1: `uvicorn backend.main:app --reload --port 8000`
- [ ] 터미널 2: `cd frontend && npm run dev`
- [ ] 전체 플로우 테스트 (업로드 → 분석 → 결과 → 공유)

### 6.2 기능 테스트 체크리스트
- [ ] 정상 셀카 → 결과 1개 출력 확인
- [ ] 얼굴 없는 이미지 → 에러 메시지 확인
- [ ] 어두운 이미지 → 에러 메시지 확인
- [ ] 대용량 이미지 → 클라이언트 리사이즈 후 업로드 확인
- [ ] 결과 페이지에서 연예인 이미지 정상 로딩 확인
- [ ] 공유 버튼 동작 확인 (링크 복사, SNS)
- [ ] 모바일 뷰포트 반응형 확인 (DevTools)
- [ ] MBTI 테스트 → 피부 테스트 진입 플로우 확인

### 6.3 확률 분포 검증
- [ ] 100회 이상 랜덤 테스트로 good/bomb 비율 확인
- [ ] good ~80%, bomb ~20% 범위 내 확인

---

## 빠른 시작 가이드 (로컬)

```bash
# 1. 백엔드 의존성 설치
cd /Users/user/works/buzzit
uv sync

# 2. 프론트엔드 의존성 설치
cd frontend && npm install && cd ..

# 3. 백엔드 서버 실행
uvicorn backend.main:app --reload --port 8000

# 4. 프론트엔드 서버 실행 (새 터미널)
cd frontend && npm run dev

# 5. 브라우저 접속
open http://localhost:3000/tests/skin-match
```

---

## 요약

| Phase | 내용 | 산출물 |
|-------|------|--------|
| 0 | 이미지 수집 | 연예인 사진 17장 (400x400) |
| 1 | 데이터 설계 | skinMatchResults.ts, 타입/확률 정의 |
| 2 | 백엔드 구축 | 피부 분석 엔진 + API (localhost:8000) |
| 3 | 프론트 개발 | 업로드/로딩/결과/에러 UI (localhost:3000) |
| 4 | 공유 기능 | 카카오/트위터/FB/링크복사 |
| 5 | 사이트 통합 | MBTI 아래 진입점, i18n |
| 6 | 통합 테스트 | 전체 플로우 + 확률 분포 검증 |
