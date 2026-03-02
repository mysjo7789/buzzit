# 🔑 Kakao JavaScript Key 발급 가이드

## 📋 전체 과정 요약

1. Kakao Developers 가입
2. 애플리케이션 생성
3. JavaScript 키 확인
4. Web 플랫폼 등록
5. .env 파일에 키 입력

---

## 1단계: Kakao Developers 접속

1. https://developers.kakao.com 접속
2. 우측 상단 **"로그인"** 클릭
3. 카카오 계정으로 로그인 (없으면 회원가입)

---

## 2단계: 애플리케이션 생성

### 2-1. 내 애플리케이션으로 이동

1. 로그인 후 우측 상단 **"내 애플리케이션"** 클릭
2. https://developers.kakao.com/console/app 페이지로 이동

### 2-2. 앱 추가하기

1. **"애플리케이션 추가하기"** 버튼 클릭
2. 앱 정보 입력:
   - **앱 이름**: `Buzzit` (또는 원하는 이름)
   - **사업자명**: 개인 또는 회사명
3. **"저장"** 클릭

---

## 3단계: JavaScript 키 확인

### 3-1. 앱 키 확인

1. 생성한 애플리케이션 클릭
2. 좌측 메뉴에서 **"앱 키"** 클릭 (또는 "요약 정보")
3. **"JavaScript 키"** 확인 및 복사

```
예시:
JavaScript 키: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

> ⚠️ **주의**: 네이티브 앱 키, REST API 키가 아닌 **JavaScript 키**를 복사해야 합니다!

---

## 4단계: Web 플랫폼 등록

### 4-1. 플랫폼 설정

1. 좌측 메뉴에서 **"플랫폼"** 클릭
2. **"Web 플랫폼 등록"** 버튼 클릭
3. 사이트 도메인 입력:

```
개발 환경:
http://localhost:5173
http://localhost:3000

운영 환경:
https://bzibzi.com
https://www.bzibzi.com
```

4. **"저장"** 클릭

### 4-2. 여러 도메인 등록

개발/스테이징/운영 환경 모두 등록 가능:

```
http://localhost:5173          (Vite 개발 서버)
http://localhost:3000          (기타 개발 서버)
https://dev.bzibzi.com         (개발 서버)
https://staging.bzibzi.com     (스테이징)
https://bzibzi.com             (운영)
https://www.bzibzi.com         (운영 - www)
```

---

## 5단계: .env 파일에 키 입력

### 5-1. .env 파일 생성

```bash
cd /Users/user/works/buzzit/frontend
cp .env.example .env
```

### 5-2. 키 입력

`.env` 파일을 열고 JavaScript 키 입력:

```bash
# Kakao SDK Configuration
VITE_KAKAO_JAVASCRIPT_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Site Configuration
VITE_SITE_URL=https://bzibzi.com
```

### 5-3. 개발 서버 재시작

```bash
npm run dev
```

---

## 6단계: 테스트

### 6-1. 로컬에서 테스트

1. http://localhost:5173/mbti 접속
2. 테스트 완료 후 결과 페이지로 이동
3. **"카카오톡"** 공유 버튼 클릭
4. 카카오톡 공유 창이 뜨면 성공! ✅

### 6-2. 오류 발생 시

브라우저 콘솔(F12)을 열고 확인:

#### ✅ 성공한 경우
```javascript
Kakao SDK initialized
```

#### ❌ 키가 설정 안 된 경우
```javascript
Kakao JavaScript Key is not set. Please set VITE_KAKAO_JAVASCRIPT_KEY in .env file
```

#### ❌ 도메인 미등록
```javascript
KakaoError: InvalidDomain
```
→ Kakao Developers에서 Web 플랫폼 도메인 확인

---

## 🔧 트러블슈팅

### 문제 1: "카카오톡 공유 기능을 사용할 수 없습니다"

**원인**:
- Kakao SDK가 로드되지 않음
- JavaScript 키가 설정되지 않음
- 도메인이 등록되지 않음

**해결**:
1. `.env` 파일에 `VITE_KAKAO_JAVASCRIPT_KEY` 확인
2. 개발 서버 재시작 (`npm run dev`)
3. 브라우저 콘솔에서 `window.Kakao` 입력
   - `undefined`면 SDK 로드 실패
   - 객체가 나오면 SDK 로드 성공

### 문제 2: "InvalidDomain" 에러

**원인**: 
현재 도메인이 Kakao Developers에 등록되지 않음

**해결**:
1. Kakao Developers → 플랫폼 → Web 플랫폼
2. 현재 접속 중인 도메인 추가
3. 예: `http://localhost:5173`

### 문제 3: 키를 입력했는데 여전히 동작 안 함

**체크리스트**:
- [ ] `.env` 파일이 `frontend/` 디렉토리에 있는가?
- [ ] 파일명이 정확히 `.env`인가? (`.env.example` 아님)
- [ ] 키 앞뒤에 따옴표가 없는가?
- [ ] 개발 서버를 재시작했는가?

**올바른 형식**:
```bash
✅ VITE_KAKAO_JAVASCRIPT_KEY=a1b2c3d4e5f6g7h8i9j0
❌ VITE_KAKAO_JAVASCRIPT_KEY="a1b2c3d4e5f6g7h8i9j0"
❌ VITE_KAKAO_JAVASCRIPT_KEY='a1b2c3d4e5f6g7h8i9j0'
```

---

## 📱 운영 환경 배포 시 주의사항

### 1. HTTPS 필수
카카오톡 공유는 HTTPS에서만 작동합니다.
- ✅ `https://bzibzi.com`
- ❌ `http://bzibzi.com`
- ✅ `http://localhost` (개발 환경 예외)

### 2. 도메인 사전 등록
배포 전에 운영 도메인을 Kakao Developers에 등록해야 합니다.

### 3. 환경변수 설정
배포 플랫폼(Cloudflare, Vercel 등)의 환경변수에 키를 설정해야 합니다.

**Cloudflare Pages 예시**:
1. Pages 프로젝트 설정
2. Environment variables
3. `VITE_KAKAO_JAVASCRIPT_KEY` 추가

---

## 🎯 빠른 확인 방법

### 브라우저 콘솔에서 확인

```javascript
// 1. Kakao SDK 로드 확인
typeof Kakao !== 'undefined'  // true여야 함

// 2. 초기화 확인
Kakao.isInitialized()  // true여야 함

// 3. 키 확인 (개발 환경)
console.log(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY)
```

### 모두 정상이면
```javascript
> typeof Kakao !== 'undefined'
true
> Kakao.isInitialized()
true
> import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

---

## 📚 추가 정보

### Kakao Developers 문서
- 공식 문서: https://developers.kakao.com/docs
- JavaScript SDK: https://developers.kakao.com/docs/latest/ko/javascript/getting-started
- 카카오톡 공유: https://developers.kakao.com/docs/latest/ko/message/js-link

### 키 보안
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env`가 포함되어 있는지 확인
- JavaScript 키는 클라이언트에 노출되므로 도메인 제한이 중요합니다

---

## ✅ 완료 체크리스트

- [ ] Kakao Developers 계정 생성
- [ ] 애플리케이션 생성
- [ ] JavaScript 키 복사
- [ ] Web 플랫폼에 도메인 등록
- [ ] `.env` 파일 생성 및 키 입력
- [ ] 개발 서버 재시작
- [ ] 카카오톡 공유 테스트 성공

모두 완료하면 카카오톡 공유 기능이 정상 작동합니다! 🎉
