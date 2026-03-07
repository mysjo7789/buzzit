#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from fastapi import FastAPI, HTTPException, Query, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
import uvicorn
from datetime import datetime, timedelta
import asyncio
import hashlib
import secrets
import os
import sys
from pathlib import Path
from typing import Optional

# backend/ 디렉토리를 sys.path에 추가 (core.skin_match 모듈 임포트용)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.sql import func
from authlib.integrations.starlette_client import OAuth
from jose import jwt as jose_jwt
from pydantic import BaseModel, Field
from fastapi import UploadFile, File as FastAPIFile
import httpx

# ── Config ──────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://buzzit:buzzit1234@localhost:5432/buzzit")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ── Database ────────────────────────────────────────────────────────

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    provider = Column(String(20), nullable=False)
    provider_id = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    nickname = Column(String(100), nullable=False, unique=True)
    profile_image = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint("provider", "provider_id"),)


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_url_hash = Column(String(64), nullable=False, index=True)
    post_url = Column(Text, nullable=False)
    user_id = Column(Integer, nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── OAuth ───────────────────────────────────────────────────────────

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="kakao",
    client_id=os.getenv("KAKAO_CLIENT_ID"),
    client_secret=os.getenv("KAKAO_CLIENT_SECRET"),
    authorize_url="https://kauth.kakao.com/oauth/authorize",
    access_token_url="https://kauth.kakao.com/oauth/token",
    client_kwargs={"scope": "profile_nickname profile_image account_email"},
)

# ── JWT helpers ─────────────────────────────────────────────────────


def create_jwt_token(user_id: int, provider: str, nickname: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "provider": provider,
        "nickname": nickname,
        "exp": expire,
    }
    return jose_jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user_optional(
    buzzit_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not buzzit_token:
        return None
    try:
        payload = jose_jwt.decode(buzzit_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def get_current_user_required(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    return user


# ── Helpers ─────────────────────────────────────────────────────────


def get_post_url_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def generate_nickname(db: Session) -> str:
    """유니크한 6자리 랜덤 닉네임 생성"""
    for _ in range(20):
        nick = secrets.token_hex(3)  # 6자리 hex
        if not db.query(User).filter(User.nickname == nick).first():
            return nick
    return secrets.token_hex(4)  # fallback 8자리


class CommentCreate(BaseModel):
    post_url: str
    content: str = Field(..., min_length=1, max_length=2000)


class NicknameUpdate(BaseModel):
    nickname: str = Field(..., min_length=2, max_length=20)


# ── FastAPI app ─────────────────────────────────────────────────────

app = FastAPI(
    title="Buzzit API",
    description="피부 닮은꼴 분석 + 인증/댓글 API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://buzzit.kr",
        "https://bzibzi.com",
        "https://www.bzibzi.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=JWT_SECRET)


@app.on_event("startup")
async def startup_event():
    async def _init_db():
        try:
            await asyncio.to_thread(Base.metadata.create_all, bind=engine)
            print("Database tables created/verified")
        except Exception as e:
            print(f"DB 초기화 실패 (나중에 재시도): {e}")

    asyncio.create_task(_init_db())


# ── Basic endpoints ─────────────────────────────────────────────────

@app.get("/kaithhealthcheck")
@app.get("/kaithheathcheck")
async def leapcell_health():
    """Leapcell 내부 헬스체크용."""
    return {"status": "ok"}


@app.get("/")
async def root():
    return {
        "message": "Buzzit API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


# ── Auth endpoints ──────────────────────────────────────────────────

@app.get("/api/auth/google/login")
async def google_login(request: Request):
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/api/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        print(f"Google OAuth error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}?auth_error=google_failed", status_code=302)

    userinfo = token.get("userinfo")
    if not userinfo:
        return RedirectResponse(url=f"{FRONTEND_URL}?auth_error=no_userinfo", status_code=302)

    user = db.query(User).filter(
        User.provider == "google",
        User.provider_id == userinfo["sub"],
    ).first()

    if not user:
        user = User(
            provider="google",
            provider_id=userinfo["sub"],
            email=userinfo.get("email"),
            nickname=generate_nickname(db),
            profile_image=userinfo.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.profile_image = userinfo.get("picture", user.profile_image)
        user.email = userinfo.get("email", user.email)
        db.commit()

    jwt_token = create_jwt_token(user.id, "google", user.nickname)
    response = RedirectResponse(url=FRONTEND_URL, status_code=302)
    response.set_cookie(
        key="buzzit_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        max_age=JWT_EXPIRE_MINUTES * 60,
        secure=False,
    )
    return response


@app.get("/api/auth/kakao/login")
async def kakao_login(request: Request):
    redirect_uri = os.getenv("KAKAO_REDIRECT_URI")
    return await oauth.kakao.authorize_redirect(request, redirect_uri)


@app.get("/api/auth/kakao/callback")
async def kakao_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.kakao.authorize_access_token(request)
    except Exception as e:
        print(f"Kakao OAuth error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}?auth_error=kakao_failed", status_code=302)

    # Kakao 사용자 정보 조회
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {token['access_token']}"},
        )
        if resp.status_code != 200:
            return RedirectResponse(url=f"{FRONTEND_URL}?auth_error=kakao_userinfo", status_code=302)
        kakao_user = resp.json()

    kakao_id = str(kakao_user["id"])
    kakao_account = kakao_user.get("kakao_account", {})
    profile = kakao_account.get("profile", {})

    user = db.query(User).filter(
        User.provider == "kakao",
        User.provider_id == kakao_id,
    ).first()

    if not user:
        user = User(
            provider="kakao",
            provider_id=kakao_id,
            email=kakao_account.get("email"),
            nickname=generate_nickname(db),
            profile_image=profile.get("profile_image_url"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.profile_image = profile.get("profile_image_url", user.profile_image)
        db.commit()

    jwt_token = create_jwt_token(user.id, "kakao", user.nickname)
    response = RedirectResponse(url=FRONTEND_URL, status_code=302)
    response.set_cookie(
        key="buzzit_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        max_age=JWT_EXPIRE_MINUTES * 60,
        secure=False,
    )
    return response


@app.get("/api/auth/me")
async def get_me(user: Optional[User] = Depends(get_current_user_optional)):
    if not user:
        return {"authenticated": False, "user": None}
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "profile_image": user.profile_image,
            "provider": user.provider,
        },
    }


@app.post("/api/auth/logout")
async def logout():
    response = JSONResponse({"message": "로그아웃 완료"})
    response.delete_cookie("buzzit_token")
    return response


@app.get("/api/auth/check-nickname")
async def check_nickname(
    nickname: str = Query(..., min_length=2, max_length=20),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    existing = db.query(User).filter(User.nickname == nickname).first()
    available = existing is None or (user is not None and existing.id == user.id)
    return {"nickname": nickname, "available": available}


@app.put("/api/auth/nickname")
async def update_nickname(
    body: NicknameUpdate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    nickname = body.nickname.strip()
    if len(nickname) < 2 or len(nickname) > 20:
        raise HTTPException(status_code=400, detail="닉네임은 2~20자여야 합니다")

    existing = db.query(User).filter(User.nickname == nickname, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="이미 사용 중인 닉네임입니다")

    user.nickname = nickname
    db.commit()

    jwt_token = create_jwt_token(user.id, user.provider, user.nickname)
    response = JSONResponse({
        "message": "닉네임이 변경되었습니다",
        "nickname": user.nickname,
    })
    response.set_cookie(
        key="buzzit_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        max_age=JWT_EXPIRE_MINUTES * 60,
        secure=False,
    )
    return response


# ── Comment endpoints ───────────────────────────────────────────────

@app.get("/api/comments")
async def get_comments(
    post_url: str = Query(..., description="원본 게시글 URL"),
    db: Session = Depends(get_db),
):
    url_hash = get_post_url_hash(post_url)
    comments = (
        db.query(Comment)
        .filter(Comment.post_url_hash == url_hash)
        .order_by(Comment.created_at.asc())
        .all()
    )

    user_ids = list(set(c.user_id for c in comments))
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

    return {
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "created_at": c.created_at.isoformat(),
                "user": {
                    "id": users[c.user_id].id,
                    "nickname": users[c.user_id].nickname,
                    "profile_image": users[c.user_id].profile_image,
                } if c.user_id in users else {"id": 0, "nickname": "Unknown", "profile_image": None},
            }
            for c in comments
        ],
        "total": len(comments),
    }


@app.post("/api/comments", status_code=201)
async def create_comment(
    body: CommentCreate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    comment = Comment(
        post_url_hash=get_post_url_hash(body.post_url),
        post_url=body.post_url,
        user_id=user.id,
        content=body.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "profile_image": user.profile_image,
        },
    }


@app.delete("/api/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다")
    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다")

    db.delete(comment)
    db.commit()
    return {"message": "댓글이 삭제되었습니다"}


# ── Object Storage (Leapcell S3) ───────────────────────────────────

_S3_ENDPOINT = "https://objstorage.leapcell.io"
_S3_BUCKET = os.getenv("OBJ_S3_BUCKET", "os-wsp2030135531681386496-pdmi-azaa-thccjllm")
_S3_ACCESS_KEY = os.getenv("OBJ_S3_ACCESS_KEY", "5872241d993b4a878f96ad69a8968a79")
_S3_SECRET_KEY = os.getenv("OBJ_S3_SECRET_KEY", "")


def _save_image_to_s3(image_bytes: bytes, result_id: str):
    """분석된 이미지를 S3에 백그라운드 저장."""
    try:
        import boto3
        s3 = boto3.client(
            "s3",
            region_name="us-east-1",
            endpoint_url=_S3_ENDPOINT,
            aws_access_key_id=_S3_ACCESS_KEY,
            aws_secret_access_key=_S3_SECRET_KEY,
        )
        key = f"skin-match/{datetime.now().strftime('%Y-%m-%d')}/{result_id}.jpg"
        s3.put_object(
            Bucket=_S3_BUCKET,
            Key=key,
            Body=image_bytes,
            ContentType="image/jpeg",
        )
        print(f"[skin-match] 이미지 저장: {key}")
    except Exception as e:
        print(f"[skin-match] 이미지 저장 실패: {e}")


# ── Skin Match endpoint ────────────────────────────────────────────

@app.post("/api/skin-match")
async def skin_match_analyze(image: UploadFile = FastAPIFile(...)):
    """AI 피부 닮은꼴 분석 API. 이미지를 분석하여 닮은 연예인을 반환한다."""
    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_format", "message": "지원하지 않는 파일 형식입니다"},
        )

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_format", "message": "파일이 너무 큽니다 (최대 10MB)"},
        )

    try:
        from core.skin_match.matcher import match_skin

        result = match_skin(image_bytes)

        # 분석 성공 시 이미지를 S3에 백그라운드 저장
        if _S3_SECRET_KEY:
            import uuid
            img_id = uuid.uuid4().hex[:12]
            asyncio.create_task(
                asyncio.to_thread(_save_image_to_s3, image_bytes, f"{result['id']}_{img_id}")
            )

        return {
            "result_id": result["id"],
            "name": result["name"],
            "title": result["title"],
            "type": result["type"],
            "share_text": f"AI 피부 닮은꼴 테스트 결과 {result['name']} 타입",
        }

    except ValueError as e:
        error_code = str(e)
        error_messages = {
            "no_face": "얼굴을 찾을 수 없습니다",
            "too_dark": "사진이 너무 어둡습니다",
            "too_blurry": "사진이 흐립니다",
            "invalid_format": "지원하지 않는 파일 형식입니다",
        }
        message = error_messages.get(error_code, "분석 중 오류가 발생했습니다")
        raise HTTPException(
            status_code=400,
            detail={"error": error_code, "message": message},
        )
    except Exception as e:
        print(f"[skin-match] Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "server_error", "message": "서버 오류가 발생했습니다"},
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
