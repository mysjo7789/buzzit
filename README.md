# Buzzit

커뮤니티 인기글 큐레이션 서비스 — https://bzibzi.com

## 구조

```
GitHub Actions (1시간마다)
  → 크롤러 실행 → buzzit_posts.json 생성
  → GitHub Pages (gh-pages 브랜치)에 배포

프론트엔드 (Cloudflare Pages)
  → 정적 JSON fetch → 클라이언트에서 필터/정렬
```

## 크롤링 사이트

- 웃긴대학 (humoruniv)
- 에펨코리아 (fmkorea)
- 루리웹 (ruliweb)
- 클리앙 (clien)
- 뽐뿌 (ppomppu)
- 보배드림 (bobaedream)
- 이토랜드 (etoland)
- MLB파크 (mlbpark)
- 딴지일보 (ddanzi)
- SLR클럽 (slrclub)

## 기술 스택

- **크롤러**: Python 3.12, httpx, BeautifulSoup, curl-cffi
- **프론트엔드**: React, TypeScript, Tailwind CSS, Vite
- **인프라**: GitHub Actions, GitHub Pages, Cloudflare Pages

## 로컬 실행

```bash
# 크롤러
python crawler_cli.py buzzit_posts.json

# 프론트엔드
cd frontend
npm install
npm run dev
```
