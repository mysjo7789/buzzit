#!/bin/bash
cd "$(dirname "$0")/frontend"

# 의존성 설치
npm install

# 프론트엔드 개발 서버 실행
npm run dev
