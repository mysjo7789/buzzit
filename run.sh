#!/bin/bash
cd "$(dirname "$0")"

# 의존성 설치
uv sync

# 백엔드 실행
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
