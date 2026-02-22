#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from fastapi import FastAPI, HTTPException, Query, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
import uvicorn
from datetime import datetime, timedelta
import asyncio
import json
import hashlib
import secrets
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.sql import func
from authlib.integrations.starlette_client import OAuth
from jose import jwt as jose_jwt
from pydantic import BaseModel, Field
import httpx

# Import crawler
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from core.crawler.main import crawl_all, save_to_json, extract_thumbnail_from_page, DEFAULT_TIMEOUT, HEADERS as CRAWLER_HEADERS
except ImportError:
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from core.crawler.main import crawl_all, save_to_json, extract_thumbnail_from_page, DEFAULT_TIMEOUT, HEADERS as CRAWLER_HEADERS

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


# ── Crawl cache ─────────────────────────────────────────────────────

CACHED_DATA: Dict[str, Any] = {}
CACHE_TIMESTAMP: str = ""
CRAWL_INTERVAL = 30 * 60  # 30분




async def _crawl_and_fill_thumbnails() -> Dict[str, Any]:
    """크롤링 + 썸네일 추출을 완료한 뒤 완성된 데이터를 반환."""
    results = await crawl_all()
    save_to_json(results)

    new_data: Dict[str, Any] = {
        "metadata": {
            "total_posts": len(results),
            "collected_at": datetime.now().isoformat(),
            "sites": list(set(post["site"] for post in results))
        },
        "posts": results
    }

    print(f"크롤링 완료: {len(new_data['metadata']['sites'])}개 사이트에서 {len(results)}개 게시글 수집")

    # 썸네일 채우기 (완료될 때까지 대기)
    await _fill_thumbnails_for(new_data)

    return new_data


async def _fill_thumbnails_for(data: Dict[str, Any]):
    """주어진 데이터의 썸네일을 채움 (CACHED_DATA를 건드리지 않음)."""
    posts = data.get("posts", [])
    no_thumb = [p for p in posts if not p.get("thumbnail")]
    if not no_thumb:
        print(f"[thumbnail] 모든 게시글에 썸네일이 있습니다")
        return

    by_site: Dict[str, list] = {}
    for p in no_thumb:
        site = p.get("site", "")
        if site:
            by_site.setdefault(site, []).append(p)

    print(f"[thumbnail] 썸네일 없는 게시글 {len(no_thumb)}개 ({len(by_site)}개 사이트) 병렬 처리 시작...")
    filled = 0

    async def _process_site(site: str, site_posts: list) -> int:
        count = 0
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            for post in site_posts:
                url = post.get("url", "")
                if not url:
                    continue
                try:
                    thumb = await extract_thumbnail_from_page(client, url, site)
                    if thumb:
                        post["thumbnail"] = thumb
                        count += 1
                except Exception as e:
                    print(f"[thumbnail] {site} error: {e}")
                    continue
        return count

    tasks = [_process_site(site, sp) for site, sp in by_site.items()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, int):
            filled += r

    print(f"[thumbnail] 완료: {filled}/{len(no_thumb)}개 썸네일 추출")


async def initialize_cache():
    global CACHED_DATA, CACHE_TIMESTAMP

    try:
        print("서버 시작 시 크롤링 실행 중...")
        new_data = await _crawl_and_fill_thumbnails()
        CACHED_DATA = new_data
        CACHE_TIMESTAMP = new_data["metadata"]["collected_at"]
    except Exception as e:
        print(f"초기 크롤링 실패: {e}")
        json_path = Path("buzzit_posts.json")
        if json_path.exists():
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    CACHED_DATA = json.load(f)
                    CACHE_TIMESTAMP = CACHED_DATA.get("metadata", {}).get("collected_at", "")
                print("기존 JSON 파일에서 데이터 로드됨")
            except Exception as load_error:
                print(f"JSON 파일 로드 실패: {load_error}")


async def periodic_crawl():
    global CACHED_DATA, CACHE_TIMESTAMP

    while True:
        try:
            await asyncio.sleep(CRAWL_INTERVAL)
            print(f"주기적 크롤링 실행 중... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")

            new_data = await _crawl_and_fill_thumbnails()

            # 크롤 + 썸네일 모두 완료된 데이터로 한 번에 교체
            CACHED_DATA = new_data
            CACHE_TIMESTAMP = new_data["metadata"]["collected_at"]

            print(f"주기적 크롤링 완료: 데이터 교체됨")

        except Exception as e:
            print(f"주기적 크롤링 실패: {e}")
            continue


# ── FastAPI app ─────────────────────────────────────────────────────

app = FastAPI(
    title="Buzzit API",
    description="실시간 트렌드/이슈 큐레이션 API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://buzzit.kr",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=JWT_SECRET)


@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")

    await initialize_cache()
    asyncio.create_task(periodic_crawl())


# ── Basic endpoints ─────────────────────────────────────────────────

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
        "cached_posts": len(CACHED_DATA.get("posts", [])) if CACHED_DATA else 0,
        "cache_timestamp": CACHE_TIMESTAMP,
        "next_crawl_in_minutes": CRAWL_INTERVAL // 60,
        "version": "1.0.0"
    }


# ── 이미지 프록시 (Referer 인증이 필요한 CDN 우회) ────────────────

# Referer 인증이 필요한 이미지 도메인 → 필요한 Referer 매핑
_IMAGE_PROXY_REFERERS: Dict[str, str] = {
    "simg.donga.com": "https://mlbpark.donga.com/",
}

@app.get("/api/image-proxy")
async def image_proxy(url: str = Query(..., description="프록시할 이미지 URL")):
    """Referer 인증이 필요한 이미지를 프록시."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    hostname = parsed.hostname or ""

    if hostname not in _IMAGE_PROXY_REFERERS:
        raise HTTPException(status_code=403, detail="Proxy not allowed for this domain")

    headers = {**CRAWLER_HEADERS, "Referer": _IMAGE_PROXY_REFERERS[hostname]}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers=headers, follow_redirects=True)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Upstream error")
        content_type = resp.headers.get("content-type", "image/jpeg")
        return Response(
            content=resp.content,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to fetch image")


@app.get("/api/posts")
async def get_posts(
    sort: Optional[str] = Query("latest", description="정렬: latest, views, likes, comments"),
    site: Optional[str] = Query(None, description="사이트 필터"),
    limit: Optional[int] = Query(None, description="결과 제한 수"),
):
    try:
        if not CACHED_DATA:
            return {"posts": [], "metadata": {"total_posts": 0, "collected_at": CACHE_TIMESTAMP}}

        posts = list(CACHED_DATA.get("posts", []))

        if site:
            posts = [p for p in posts if p.get("site") == site]

        if sort == "views":
            posts.sort(key=lambda p: p.get("views") or 0, reverse=True)
        elif sort == "likes":
            posts.sort(key=lambda p: p.get("likes") or 0, reverse=True)
        elif sort == "comments":
            posts.sort(key=lambda p: p.get("comments") or 0, reverse=True)
        else:
            posts.sort(key=lambda p: p.get("collected_at", ""), reverse=True)

        if limit:
            posts = posts[:limit]

        return {
            "posts": posts,
            "metadata": {
                "total_posts": len(posts),
                "collected_at": CACHE_TIMESTAMP,
                "sites": list(set(p["site"] for p in CACHED_DATA.get("posts", [])))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 조회 실패: {str(e)}")


@app.get("/api/post/detail")
async def get_post_detail(
    url: str = Query(..., description="원본 게시글 URL"),
    db: Session = Depends(get_db),
):
    post_data = None
    if CACHED_DATA:
        for p in CACHED_DATA.get("posts", []):
            if p.get("url") == url:
                post_data = p
                break

    if not post_data:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    url_hash = get_post_url_hash(url)
    comment_count = db.query(Comment).filter(Comment.post_url_hash == url_hash).count()

    return {
        "post": post_data,
        "buzzit_comments": comment_count,
    }


@app.get("/api/posts/{site}")
async def get_posts_by_site(site: str):
    try:
        if not CACHED_DATA:
            return {"posts": [], "metadata": {"total_posts": 0, "collected_at": CACHE_TIMESTAMP}}

        filtered_posts = [post for post in CACHED_DATA.get("posts", []) if post.get("site") == site]

        return {
            "posts": filtered_posts,
            "metadata": {
                "site": site,
                "total_posts": len(filtered_posts),
                "collected_at": CACHE_TIMESTAMP
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 조회 실패: {str(e)}")


@app.post("/api/crawl")
async def crawl_posts():
    try:
        global CACHED_DATA, CACHE_TIMESTAMP

        print("수동 크롤링 실행 중...")
        results = await crawl_all()
        save_to_json(results)

        CACHED_DATA = {
            "metadata": {
                "total_posts": len(results),
                "collected_at": datetime.now().isoformat(),
                "sites": list(set(post["site"] for post in results))
            },
            "posts": results
        }
        CACHE_TIMESTAMP = CACHED_DATA["metadata"]["collected_at"]

        print(f"수동 크롤링 완료: {len(results)}개 게시글 수집")

        return {
            "message": "크롤링 완료",
            "total_posts": len(results),
            "collected_at": CACHE_TIMESTAMP,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"크롤링 실패: {str(e)}")


@app.get("/api/sites")
async def get_sites():
    sites = [
        {"name": "웃긴대학", "code": "humoruniv", "url": "https://web.humoruniv.com/"},
        {"name": "루리웹", "code": "ruliweb", "url": "https://bbs.ruliweb.com/"},
        {"name": "이토랜드", "code": "etoland", "url": "https://www.etoland.co.kr/"},
        {"name": "인벤", "code": "inven", "url": "https://www.inven.co.kr/"},
        {"name": "클리앙", "code": "clien", "url": "https://www.clien.net/"},
        {"name": "MLB파크", "code": "mlbpark", "url": "https://mlbpark.donga.com/"},
        {"name": "딴지일보", "code": "ddanzi", "url": "https://www.ddanzi.com/"},
        {"name": "보배드림", "code": "bobaedream", "url": "https://www.bobaedream.co.kr/"},
        {"name": "뽐뿌", "code": "ppomppu", "url": "https://www.ppomppu.co.kr/"},
    ]

    return {"sites": sites}


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


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
