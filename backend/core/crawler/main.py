#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, urljoin, parse_qs, urlencode, urlunparse
from datetime import datetime

import httpx
from bs4 import BeautifulSoup, Tag

DEFAULT_TIMEOUT = httpx.Timeout(15.0, connect=1.0, read=10.0)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}
_FMKOREA_HEADERS = {
    **HEADERS,
    "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
}
REQUEST_DELAY_SEC = 1.5

@dataclass
class Post:
    site: str
    title: str
    url: str
    author: Optional[str] = None
    timestamp: Optional[str] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    collected_at: Optional[str] = None
    thumbnail: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "site": self.site,
            "title": self.title,
            "url": self.url,
            "author": self.author,
            "timestamp": self.timestamp,
            "views": self.views,
            "likes": self.likes,
            "comments": self.comments,
            "collected_at": self.collected_at or datetime.now().isoformat(),
            "thumbnail": self.thumbnail,
        }


# 썸네일 추출 lazy-load 속성
_LAZY_ATTRS = ["data-src", "data-original", "data-lazy-src", "data-lazy"]

# 리스팅 썸네일에서 제외할 URL 패턴 (프로필, UI 아이콘, 배지 등)
_THUMB_EXCLUDE_PATTERNS = (
    "profile", "avatar", "icon", "logo", "emoticon", "emot",
    "placeholder", "blank", "spacer", "noimg", "no_img",
    "/img/new_icon", "/img/renewal", "/img/rank/", "/renew/images/",
    "/newimg/",
    "/board/level/", "/level/",
    "num01", "num02", "num03", "num04", "num05",
    "num06", "num07", "num08", "num09", "num10",
    ".svg",
)

def _extract_thumbnail(element, base_url: str) -> Optional[str]:
    """목록 HTML 요소에서 첫 번째 유효한 콘텐츠 이미지 URL을 썸네일로 추출."""
    if not element:
        return None
    for img in element.find_all("img", limit=5):
        src = None
        # lazy-load 속성 우선
        for attr in _LAZY_ATTRS:
            val = img.get(attr)
            if val and val.startswith(("http", "/")):
                src = val
                break
        if not src:
            src = img.get("src", "")
        if not src or src.startswith("data:"):
            continue
        # 아이콘/이모지/배지/프로필 등 비콘텐츠 이미지 제외
        src_lower = src.lower()
        if any(p in src_lower for p in _THUMB_EXCLUDE_PATTERNS):
            continue
        # 작은 이미지 제외
        width = img.get("width", "")
        height = img.get("height", "")
        if width and str(width).isdigit() and int(width) < 30:
            continue
        if height and str(height).isdigit() and int(height) < 30:
            continue
        # 절대 URL로 변환
        if not src.startswith("http"):
            src = urljoin(base_url, src)
        return src
    return None

def _to_int_safe(text: Optional[str]) -> Optional[int]:
    if not text:
        return None
    text = text.replace(",", "").strip()
    m = re.search(r"(\d+)", text)
    return int(m.group(1)) if m else None

def _decode_html(url: str, content: bytes, declared_encoding: Optional[str]) -> Optional[str]:
    host = urlparse(url).netloc

    # 1) 사이트 힌트
    if "humoruniv.com" in host or "mlbpark.donga.com" in host:
        # MLB파크는 UTF-8 선언이지만 일부 바이트가 깨짐 → UTF-8 replace로 처리
        if "mlbpark.donga.com" in host:
            return content.decode("utf-8", errors="replace")
        else:
            for enc in ("cp949", "euc-kr", "utf-8", declared_encoding or ""):
                if not enc:
                    continue
                try:
                    return content.decode(enc, errors="strict")
                except Exception:
                    continue
            # 마지막 폴백
            return content.decode("cp949", errors="ignore")

    # 2) 기타: 선언 인코딩 → UTF-8 → CP949 → LATIN-1 순서
    tried = []
    for enc in [declared_encoding, "utf-8", "cp949", "euc-kr", "latin-1"]:
        if not enc or enc in tried:
            continue
        tried.append(enc)
        try:
            return content.decode(enc, errors="strict")
        except Exception:
            continue
    return content.decode("utf-8", errors="ignore")

async def fetch_html(client: httpx.AsyncClient, url: str) -> Optional[str]:
    short_url = url[:80]
    for attempt in range(3):
        try:
            r = await client.get(url, headers=HEADERS, timeout=DEFAULT_TIMEOUT, follow_redirects=True)
            if r.status_code == 200 and r.content:
                return _decode_html(url, r.content, r.encoding)
            print(f"[fetch] {short_url} attempt {attempt + 1}: HTTP {r.status_code}")
        except httpx.ConnectTimeout:
            print(f"[fetch] {short_url}: ConnectTimeout, skip retries")
            return None
        except Exception as e:
            print(f"[fetch] {short_url} attempt {attempt + 1}: {type(e).__name__}: {e}")
        await asyncio.sleep(1.0 + attempt)
    return None

def _abs(url: str, base: str) -> str:
    """상대경로를 절대경로로. 특수 케이스(웃대 read.html)도 보정"""
    if url.startswith("http"):
        return url
    # humoruniv의 read.html 같은 케이스 보정
    if "humoruniv.com" in base and url.startswith("read.html"):
        return urljoin("https://web.humoruniv.com/board/humor/", url)
    return urljoin(base, url)

# ---------------------------
# Parsers
# ---------------------------

def parse_fmkorea(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []

    table = soup.select_one("table.bd_lst")
    if not table:
        return posts

    for tr in table.select("tbody tr"):
        if "notice" in tr.get("class", []):
            continue

        title_link = tr.select_one("a.hx")
        if not title_link:
            continue

        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")

        if not title or not href or len(title) < 3:
            continue

        url = _abs(href, "https://www.fmkorea.com/")

        tds = tr.select("td")
        if len(tds) < 5:
            continue

        author = tds[2].get_text(strip=True) if len(tds) > 2 else None
        timestamp = tds[3].get_text(strip=True) if len(tds) > 3 else None
        views = _to_int_safe(tds[4].get_text(strip=True)) if len(tds) > 4 else None
        likes = _to_int_safe(tds[5].get_text(strip=True)) if len(tds) > 5 else None

        comments = None
        comment_a = tr.select_one("a.replyNum")
        if comment_a:
            comments = _to_int_safe(comment_a.get_text(strip=True))

        thumbnail = _extract_thumbnail(tr, "https://www.fmkorea.com/")
        posts.append(Post(site="fmkorea", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))

    return dedupe_posts(posts)


_fmkorea_session = None

def _get_fmkorea_session():
    """curl_cffi 세션 싱글턴 (쿠키 유지)"""
    global _fmkorea_session
    if _fmkorea_session is None:
        from curl_cffi import requests as cffi_requests
        _fmkorea_session = cffi_requests.Session(impersonate="chrome")
    return _fmkorea_session

def _fmkorea_fetch_sync(url: str) -> Optional[str]:
    """curl_cffi 동기 호출 (세션 쿠키 유지, 별도 스레드에서 실행)"""
    try:
        session = _get_fmkorea_session()
        r = session.get(url, headers=_FMKOREA_HEADERS, timeout=30)
        if r.status_code != 200:
            print(f"[fmkorea] HTTP {r.status_code} for {url[:60]}")
            return None
        return _decode_html(url, r.content, r.encoding)
    except Exception as e:
        print(f"[fmkorea] fetch error: {type(e).__name__}: {e}")
        return None


async def crawl_fmkorea() -> List[Post]:
    """에펨코리아 페이지 1~2 크롤링 (Cloudflare 우회를 위해 curl_cffi 사용)"""
    base = "https://www.fmkorea.com/index.php?mid=humor&category=486622"
    all_posts: List[Post] = []
    loop = asyncio.get_event_loop()

    for page in range(1, 3):
        url = f"{base}&page={page}" if page > 1 else base
        html = await loop.run_in_executor(None, _fmkorea_fetch_sync, url)
        if not html:
            continue
        posts = parse_fmkorea(url, html)
        all_posts.extend(posts)
        print(f"[fmkorea] page {page}: {len(posts)} items")

    all_posts = dedupe_posts(all_posts)
    print(f"[fmkorea] total: {len(all_posts)} items")
    return all_posts


def parse_humoruniv(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []

    # 웃긴대학: 테이블 행에서 read.html 링크를 찾아 파싱
    # 구조: td.li_num | td.li_sbj(제목) | td.li_icn | td | td(작성자) | td.li_date | td.li_und(조회) | td.li_und(추천) | td.li_und(댓글)
    for tr in soup.select("tr"):
        link = tr.select_one('td.li_sbj a[href*="read.html"]')
        if not link:
            continue

        title = link.get_text(strip=True)
        href = link.get("href", "")

        if not title or not href or len(title) < 3:
            continue

        # 제목에서 [N]답글추천 +N 등 부가 텍스트 제거
        title = re.sub(r'\[\d+\].*$', '', title).strip()
        if len(title) < 3:
            continue

        url = _abs(href, "https://web.humoruniv.com/board/humor/")

        # td.li_und 셀들에서 조회수, 추천수, 댓글수 추출 (순서대로)
        und_cells = tr.select("td.li_und")
        views = _to_int_safe(und_cells[0].get_text(strip=True)) if len(und_cells) > 0 else None
        likes = _to_int_safe(und_cells[1].get_text(strip=True)) if len(und_cells) > 1 else None
        comments = _to_int_safe(und_cells[2].get_text(strip=True)) if len(und_cells) > 2 else None

        thumbnail = _extract_thumbnail(tr, "https://web.humoruniv.com/")
        posts.append(Post(site="humoruniv", title=title, url=url, views=views, likes=likes, comments=comments, thumbnail=thumbnail))

    return dedupe_posts(posts)


async def crawl_humoruniv_multi_pages() -> List[Post]:
    """웃긴대학 페이지 1~2 크롤링"""
    base = "https://web.humoruniv.com/board/humor/list.html?table=pds&st=day"
    all_posts: List[Post] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for page in range(1, 3):
            url = f"{base}&pg={page}" if page > 1 else base
            try:
                response = await client.get(url, headers=HEADERS)
                response.raise_for_status()
                html = _decode_html(url, response.content, response.encoding)
                if html:
                    posts = parse_humoruniv(url, html)
                    all_posts.extend(posts)
                    print(f"[humoruniv] page {page}: {len(posts)} items")
            except Exception as e:
                print(f"[humoruniv] page {page}: error - {e}")
                continue
    all_posts = dedupe_posts(all_posts)
    print(f"[humoruniv] total: {len(all_posts)} items")
    return all_posts


def parse_ruliweb(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []

    for tr in soup.select("table.board_list_table tr.table_body"):
        # 공지글 제외
        if "notice" in (tr.get("class") or []):
            continue

        title_link = tr.select_one("td.subject a.subject_link")
        if not title_link:
            continue

        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")

        if not title or not href or len(title) < 5:
            continue

        url = _abs(href, "https://bbs.ruliweb.com/")

        views = None
        hit_td = tr.select_one("td.hit")
        if hit_td:
            views = _to_int_safe(hit_td.get_text(strip=True))

        likes = None
        recomd_td = tr.select_one("td.recomd")
        if recomd_td:
            likes = _to_int_safe(recomd_td.get_text(strip=True))

        comments = None
        reply_span = tr.select_one("span.num_reply")
        if reply_span:
            comments = _to_int_safe(reply_span.get_text(strip=True).strip("[]"))

        author = None
        writer_td = tr.select_one("td.writer")
        if writer_td:
            author = writer_td.get_text(strip=True)

        timestamp = None
        time_td = tr.select_one("td.time")
        if time_td:
            timestamp = time_td.get_text(strip=True)

        thumbnail = _extract_thumbnail(tr, "https://bbs.ruliweb.com/")
        posts.append(Post(site="ruliweb", title=title, url=url, author=author,
                          views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))

    return dedupe_posts(posts)

def parse_etoland(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []

    board = soup.select_one("#fboardlist") or soup.select_one(".board_list_wrap")
    if not board:
        return posts

    for li in board.select("li.list"):
        # 광고글 제외
        if "ad_list" in (li.get("class") or []):
            continue

        title_link = li.select_one("div.subject a.subject_a")
        if not title_link:
            title_link = li.select_one('a[href*="etohumor07&wr_id="]')
        if not title_link:
            continue

        href = title_link.get("href", "")
        if "#commentContents" in href:
            continue

        title = title_link.get_text(strip=True)
        title = re.sub(r'^\d+', '', title).strip()

        if not title or len(title) < 5:
            continue

        url = _abs(href, "https://www.etoland.co.kr/")

        # 조회수
        views = None
        views_div = li.select_one("div.views")
        if views_div:
            views = _to_int_safe(views_div.get_text(strip=True))

        # 추천수
        likes = None
        likes_div = li.select_one("div.sympathys")
        if likes_div:
            likes = _to_int_safe(likes_div.get_text(strip=True))

        # 댓글수
        comments = None
        comment_el = li.select_one("a.comment_count b") or li.select_one("span.comment_count b")
        if comment_el:
            comments = _to_int_safe(comment_el.get_text(strip=True))

        # 작성자
        author = None
        author_span = li.select_one("div.writer span.member")
        if author_span:
            author = author_span.get_text(strip=True)

        # 날짜
        timestamp = None
        date_div = li.select_one("div.datetime")
        if date_div:
            timestamp = date_div.get_text(strip=True)

        thumbnail = _extract_thumbnail(li, "https://www.etoland.co.kr/")
        posts.append(Post(site="etoland", title=title, url=url, author=author,
                          views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))

    return dedupe_posts(posts)

def parse_inven(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 인벤은 a.subject-link 구조
    for title_link in soup.select('a.subject-link[href*="board/webzine/2097"]'):
        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        # [기타] 카테고리 글 제외
        category_span = title_link.select_one("span.category")
        if category_span and "[기타]" in category_span.get_text():
            continue
            
        # 제목에서 [유머] 태그 제거
        title = re.sub(r'^\[유머\]\s*', '', title).strip()
        
        url = _abs(href, "https://www.inven.co.kr/")
        
        # 부모 tr에서 메타 정보 추출
        parent_tr = title_link.find_parent("tr")
        views = likes = comments = None
        author = None
        timestamp = None
        
        if parent_tr:
            # 조회수 추출 (td.view)
            view_td = parent_tr.select_one("td.view")
            if view_td:
                view_text = view_td.get_text(strip=True).replace(",", "")
                views = _to_int_safe(view_text)
            
            # 추천수 추출 (td.reco)
            reco_td = parent_tr.select_one("td.reco")
            if reco_td:
                reco_text = reco_td.get_text(strip=True).replace(",", "")
                likes = _to_int_safe(reco_text)
            
            # 댓글수 추출 (con-comment 클래스)
            comment_span = parent_tr.select_one(".con-comment")
            if comment_span:
                comment_text = comment_span.get_text(strip=True).strip("[]")
                comments = _to_int_safe(comment_text)
            
            # 작성자 추출 (td.user 안의 span.layerNickName)
            user_td = parent_tr.select_one("td.user")
            if user_td:
                author_span = user_td.select_one("span.layerNickName")
                if author_span:
                    author = author_span.get_text(strip=True)
        
        # 인벤운영팀 작성자 글 제외
        if author and "인벤운영팀" in author:
            continue
            
        # 조회수 3000 미만인 글 제외
        if views is None or views < 3000:
            continue

        thumbnail = _extract_thumbnail(parent_tr, "https://www.inven.co.kr/") if parent_tr else None
        posts.append(Post(site="inven", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

def parse_dcinside(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 디시인사이드는 .ub-content 구조
    for article in soup.select(".ub-content"):
        # 제목 링크 찾기
        title_link = article.select_one("a[href*='gall.dcinside.com']")
        if not title_link:
            continue
            
        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://gall.dcinside.com/")
        
        # 메타 정보 추출
        views = _to_int_safe(article.select_one(".count") and article.select_one(".count").get_text())
        likes = _to_int_safe(article.select_one(".recomm") and article.select_one(".recomm").get_text())
        comments = _to_int_safe(article.select_one(".reply") and article.select_one(".reply").get_text())
        author = article.select_one(".writer") and article.select_one(".writer").get_text(strip=True)
        timestamp = article.select_one("time") and article.select_one("time").get("datetime")

        thumbnail = _extract_thumbnail(article, "https://gall.dcinside.com/")
        posts.append(Post(site="dcinside", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

def parse_clien(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 클리앙은 .list_item.symph_row 구조
    for item in soup.select(".list_item.symph_row"):
        # 제목 링크 찾기
        title_link = item.select_one("a.list_subject")
        if not title_link:
            continue
            
        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://www.clien.net/")
        
        # 메타 정보 추출
        hit_el = item.select_one("div.list_hit span.hit")
        views = _to_int_safe(hit_el.get_text(strip=True)) if hit_el else None
        likes = _to_int_safe(item.select_one(".list_symph.view_symph span") and item.select_one(".list_symph.view_symph span").get_text())
        comments = _to_int_safe(item.select_one(".rSymph05") and item.select_one(".rSymph05").get_text())
        author = item.select_one(".nickname span") and item.select_one(".nickname span").get_text(strip=True)

        thumbnail = _extract_thumbnail(item, "https://www.clien.net/")
        posts.append(Post(site="clien", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=None, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

def parse_dogdrip(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 개드립은 .list_item 구조
    for item in soup.select(".list_item"):
        # 제목 링크 찾기
        title_link = item.select_one("a[href*='dogdrip.net']")
        if not title_link:
            continue
            
        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://www.dogdrip.net/")
        
        # 메타 정보 추출
        views = _to_int_safe(item.select_one(".count") and item.select_one(".count").get_text())
        likes = _to_int_safe(item.select_one(".vote") and item.select_one(".vote").get_text())
        comments = _to_int_safe(item.select_one(".reply") and item.select_one(".reply").get_text())
        author = item.select_one(".author") and item.select_one(".author").get_text(strip=True)
        timestamp = item.select_one("time") and item.select_one("time").get("datetime")

        thumbnail = _extract_thumbnail(item, "https://www.dogdrip.net/")
        posts.append(Post(site="dogdrip", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

def parse_theqoo(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 더쿠는 .list_item 구조
    for item in soup.select(".list_item"):
        # 제목 링크 찾기
        title_link = item.select_one("a[href*='theqoo.net']")
        if not title_link:
            continue
            
        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://theqoo.net/")
        
        # 메타 정보 추출
        views = _to_int_safe(item.select_one(".count") and item.select_one(".count").get_text())
        likes = _to_int_safe(item.select_one(".vote") and item.select_one(".vote").get_text())
        comments = _to_int_safe(item.select_one(".reply") and item.select_one(".reply").get_text())
        author = item.select_one(".author") and item.select_one(".author").get_text(strip=True)
        timestamp = item.select_one("time") and item.select_one("time").get("datetime")

        thumbnail = _extract_thumbnail(item, "https://theqoo.net/")
        posts.append(Post(site="theqoo", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

def parse_mlbpark(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # MLB파크는 div.tit a.txt 구조
    for title_elem in soup.select("div.tit a.txt"):
        title = title_elem.get_text(strip=True)
        href = title_elem.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://mlbpark.donga.com/")
        
        # 부모 tr에서 메타 정보 찾기
        parent_tr = title_elem.find_parent("tr")
        views = likes = comments = None
        author = None
        
        if parent_tr:
            # 조회수 추출 (span.viewV)
            view_span = parent_tr.select_one("span.viewV")
            if view_span:
                view_text = view_span.get_text(strip=True).replace(",", "")
                views = _to_int_safe(view_text)
            
            # 작성자 추출 (span.nick)
            nick_span = parent_tr.select_one("span.nick")
            if nick_span:
                author = nick_span.get_text(strip=True)
            
            # 댓글수 추출 (span.replycnt)
            reply_span = parent_tr.select_one("span.replycnt")
            if reply_span:
                reply_text = reply_span.get_text(strip=True).strip("[]")
                comments = _to_int_safe(reply_text)

        thumbnail = _extract_thumbnail(parent_tr, "https://mlbpark.donga.com/") if parent_tr else None
        posts.append(Post(site="mlbpark", title=title, url=url, author=author, views=views, likes=likes, comments=comments, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

def parse_82cook(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 82cook은 .title 클래스의 링크들
    for title_elem in soup.select(".title a"):
        title = title_elem.get_text(strip=True)
        href = title_elem.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://www.82cook.com/")
        
        # 부모 요소에서 메타 정보 찾기
        parent = title_elem.find_parent("tr") or title_elem.find_parent("li")
        views = likes = comments = None
        
        if parent:
            txt = parent.get_text(" ", strip=True)
            views = _to_int_safe(re.search(r"조회수\s*:?\s*([\d,]+)", txt) and re.search(r"조회수\s*:?\s*([\d,]+)", txt).group(1))
            comments = _to_int_safe(re.search(r"(\d+)\s*개의\s*댓글", txt) and re.search(r"(\d+)\s*개의\s*댓글", txt).group(1))

        thumbnail = _extract_thumbnail(parent, "https://www.82cook.com/") if parent else None
        posts.append(Post(site="82cook", title=title, url=url, views=views, likes=likes, comments=comments, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

def parse_damoang(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 다모앙은 a.da-link-block.da-article-link 구조
    for title_link in soup.select("a.da-link-block.da-article-link"):
        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://damoang.net/")
        
        # 부모 컨테이너에서 메타 정보 찾기
        parent_container = title_link.find_parent("div", class_="d-inline-flex")
        if not parent_container:
            continue
            
        # 홍보 게시글 제외 (div.rcmd-box에 "홍보" 텍스트가 있는 경우)
        rcmd_box = parent_container.select_one("div.rcmd-box")
        if rcmd_box and "홍보" in rcmd_box.get_text():
            continue
            
        # 공지 게시글 제외 (alt="공지" 이미지가 있는 경우)
        notice_img = parent_container.select_one("img[alt='공지']")
        if notice_img:
            continue
            
        # 댓글수 추출 (span.count-plus.orangered)
        comments = None
        comment_span = parent_container.select_one("span.count-plus.orangered")
        if comment_span:
            comments_text = comment_span.get_text(strip=True)
            comments = _to_int_safe(comments_text)
        
        # 댓글수가 숫자가 아닌 경우 제외
        if comments is None:
            continue
            
        # 댓글수가 5 미만인 경우 제외 (인기글 필터링)
        if comments < 5:
            continue

        thumbnail = _extract_thumbnail(parent_container, "https://damoang.net/")
        posts.append(Post(site="damoang", title=title, url=url, views=None, likes=None, comments=comments, thumbnail=thumbnail))
    
    return dedupe_posts(posts)

async def get_damoang_post_details(posts: List[Post]) -> List[Post]:
    """다모앙 게시글의 상세 정보(조회수, 추천수)를 가져오기"""
    detailed_posts = []
    
    for post in posts:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(post.url, headers=HEADERS)
                response.raise_for_status()
                
                html = _decode_html(post.url, response.content, response.encoding)
                if html:
                    soup = BeautifulSoup(html, "lxml")
                    
                    # 조회수 추출 (i.bi-eye 다음의 텍스트)
                    views = None
                    eye_icon = soup.find("i", class_="bi-eye")
                    if eye_icon and eye_icon.next_sibling:
                        views_text = eye_icon.next_sibling.strip()
                        views = _to_int_safe(views_text)
                    
                    # 조회수 추출 대안 (div.pe-2.text-center에서 조회수 찾기)
                    if views is None:
                        view_divs = soup.select("div.pe-2.text-center")
                        for div in view_divs:
                            if "bi-eye" in div.get_text():
                                views_text = div.get_text().replace("조회", "").strip()
                                views = _to_int_safe(views_text)
                                break
                    
                    # 추천수 추출 (추천 버튼의 숫자)
                    likes = None
                    rcmd_btn = soup.select_one("div.pe-2.text-center[onclick*='showRcmdList']")
                    if rcmd_btn:
                        likes_text = rcmd_btn.get_text(strip=True)
                        likes = _to_int_safe(likes_text)
                    
                    # 조회수가 1000 이상인 경우만 포함
                    if views is not None and views >= 1000:
                        post.views = views
                        post.likes = likes
                        detailed_posts.append(post)
                        print(f"[damoang] {post.title}: views={views}, likes={likes}")
                    
                    # 요청 간격 조절
                    await asyncio.sleep(0.5)
                    
        except Exception as e:
            print(f"[damoang] Failed to get details for {post.url}: {e}")
            continue
    
    return detailed_posts

async def crawl_damoang_multi_pages() -> List[Post]:
    """다모앙 페이지 1~3까지 크롤링"""
    all_posts = []
    
    for page in range(1, 4):  # 1, 2, 3 페이지
        url = f"https://damoang.net/free?page={page}"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=HEADERS)
                response.raise_for_status()
                
                html = _decode_html(url, response.content, response.encoding)
                if html:
                    posts = parse_damoang(url, html)
                    all_posts.extend(posts)
                    print(f"[damoang] page {page}: parsed {len(posts)} items")
                else:
                    print(f"[damoang] page {page}: failed to decode HTML")
                    
        except Exception as e:
            print(f"[damoang] page {page}: error - {e}")
            continue
    
    # 중복 제거
    all_posts = dedupe_posts(all_posts)
    print(f"[damoang] total parsed: {len(all_posts)} items")
    
    # 상세 정보 가져오기 (조회수 1000 이상 필터링)
    detailed_posts = await get_damoang_post_details(all_posts)
    print(f"[damoang] with 1000+ views: {len(detailed_posts)} items")
    
    return detailed_posts

def parse_ddanzi(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []

    # 딴지일보: table.fz_change 내 tr에서 파싱
    # 컬럼: td.no | td.title | td.author | td.time | td.voteNum | td.hit
    table = soup.select_one("table.fz_change")
    if not table:
        return posts

    for tr in table.select("tr"):
        # 공지글 제외
        if "notice" in (tr.get("class") or []):
            continue

        tds = tr.select("td")
        if len(tds) < 5:
            continue

        title_td = tr.select_one("td.title")
        if not title_td:
            continue

        title_link = title_td.select_one('a[href*="/free/"]') or title_td.select_one('a[href*="mid=free"]')
        if not title_link:
            continue

        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")

        if not title or len(title) < 5:
            continue

        url = _abs(href, "https://www.ddanzi.com/")

        # 메타데이터 추출
        vote_td = tr.select_one("td.voteNum")
        hit_td = tr.select_one("td.readNum") or tr.select_one("td.hit")
        author_td = tr.select_one("td.author")

        likes = _to_int_safe(vote_td.get_text(strip=True)) if vote_td else None
        views = _to_int_safe(hit_td.get_text(strip=True)) if hit_td else None
        author = author_td.get_text(strip=True) if author_td else None

        thumbnail = _extract_thumbnail(tr, "https://www.ddanzi.com/")
        posts.append(Post(site="ddanzi", title=title, url=url, author=author, views=views, likes=likes, thumbnail=thumbnail))

    return dedupe_posts(posts)


async def crawl_ddanzi_multi_pages() -> List[Post]:
    """딴지일보 페이지 1~2 크롤링"""
    all_posts: List[Post] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for page in range(1, 3):
            url = f"https://www.ddanzi.com/index.php?mid=free&page={page}" if page > 1 else "https://www.ddanzi.com/free"
            try:
                response = await client.get(url, headers=HEADERS)
                response.raise_for_status()
                html = _decode_html(url, response.content, response.encoding)
                if html:
                    posts = parse_ddanzi(url, html)
                    all_posts.extend(posts)
                    print(f"[ddanzi] page {page}: {len(posts)} items")
            except Exception as e:
                print(f"[ddanzi] page {page}: error - {e}")
                continue
    all_posts = dedupe_posts(all_posts)
    print(f"[ddanzi] total: {len(all_posts)} items")
    return all_posts


def parse_bobaedream(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []

    # 보배드림: 일반 게시글만 (tr.best 상위 고정글 제외)
    for tr in soup.select("tr[itemtype='http://schema.org/Article']"):
        # 제목 링크 찾기
        title_link = tr.select_one("a.bsubject")
        if not title_link:
            continue
            
        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        url = _abs(href, "https://www.bobaedream.co.kr/")
        
        # 추천수 추출
        recomm_cell = tr.select_one("td.recomm")
        likes = None
        if recomm_cell:
            likes_text = recomm_cell.get_text(strip=True)
            likes = _to_int_safe(likes_text)

            # 추천 3개 미만이면 제외
            if likes is None or likes < 3:
                continue
        
        # 댓글수 추출
        comments = None
        comment_span = tr.select_one("span.Comment strong.totreply")
        if comment_span:
            comments = _to_int_safe(comment_span.get_text(strip=True))
        
        # 조회수 추출
        views = None
        count_cell = tr.select_one("td.count")
        if count_cell:
            views_text = count_cell.get_text(strip=True)
            views = _to_int_safe(views_text)
        
        # 작성자 추출
        author = None
        author_span = tr.select_one("span.author")
        if author_span:
            author = author_span.get_text(strip=True)
        
        # 날짜 추출
        timestamp = None
        date_cell = tr.select_one("td.date")
        if date_cell:
            timestamp = date_cell.get_text(strip=True)

        thumbnail = _extract_thumbnail(tr, "https://www.bobaedream.co.kr/")
        posts.append(Post(site="bobaedream", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))
    
    return dedupe_posts(posts)


async def crawl_bobaedream_multi_pages() -> List[Post]:
    """보배드림 페이지 1~5까지 크롤링"""
    all_posts: List[Post] = []
    base = "https://www.bobaedream.co.kr/list?code=strange"

    async with httpx.AsyncClient(timeout=30.0) as client:
        for page in range(1, 6):  # 1~5 페이지
            url = f"{base}&page={page}" if page > 1 else base
            try:
                response = await client.get(url, headers=HEADERS)
                response.raise_for_status()
                html = _decode_html(url, response.content, response.encoding)
                if html:
                    posts = parse_bobaedream(url, html)
                    all_posts.extend(posts)
                    print(f"[bobaedream] page {page}: parsed {len(posts)} items")
                else:
                    print(f"[bobaedream] page {page}: failed to decode HTML")
            except Exception as e:
                print(f"[bobaedream] page {page}: error - {e}")
                continue

    all_posts = dedupe_posts(all_posts)
    print(f"[bobaedream] total parsed: {len(all_posts)} items")
    return all_posts


def parse_ppomppu(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []
    
    # 뽐뿌는 baseList-title 클래스를 가진 링크들에서 게시글 찾기
    for link in soup.select("a.baseList-title"):
        title = link.get_text(strip=True)
        href = link.get("href", "")
        
        if not title or not href or len(title) < 5:
            continue
            
        # freeboard 게시글만 필터링
        if "view.php?id=freeboard" not in href:
            continue
            
        url = _abs(href, base_url)
        # 불필요한 쿼리 파라미터 제거 (page, divpage, hotlist_flag → 404 유발)
        parsed = urlparse(url)
        params = {k: v for k, v in parse_qs(parsed.query).items() if k in ("id", "no")}
        url = urlunparse(parsed._replace(query=urlencode(params, doseq=True)))
        
        # 부모 tr에서 메타 정보 추출
        parent_tr = link.find_parent("tr")
        views = likes = comments = None
        author = None
        timestamp = None
        
        if parent_tr:
            # 조회수 추출
            views_cell = parent_tr.select_one("td.baseList-views")
            if views_cell:
                views = _to_int_safe(views_cell.get_text(strip=True))
            
            # 작성자 추출
            author_cell = parent_tr.select_one("td.baseList-name span")
            if author_cell:
                author = author_cell.get_text(strip=True)
            
            # 날짜 추출
            time_cell = parent_tr.select_one("time.baseList-time")
            if time_cell:
                timestamp = time_cell.get_text(strip=True)

        thumbnail = _extract_thumbnail(parent_tr, base_url) if parent_tr else None
        posts.append(Post(site="ppomppu", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))
    
    return dedupe_posts(posts)


async def crawl_ppomppu_multi_pages() -> List[Post]:
    """뽐뿌 페이지 1~2 크롤링"""
    base = "https://www.ppomppu.co.kr/zboard/zboard.php?id=freeboard&hotlist_flag=999"
    all_posts: List[Post] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for page in range(1, 3):
            url = f"{base}&page={page}" if page > 1 else base
            try:
                response = await client.get(url, headers=HEADERS)
                response.raise_for_status()
                html = _decode_html(url, response.content, response.encoding)
                if html:
                    posts = parse_ppomppu(url, html)
                    all_posts.extend(posts)
                    print(f"[ppomppu] page {page}: {len(posts)} items")
            except Exception as e:
                print(f"[ppomppu] page {page}: error - {e}")
                continue
    all_posts = dedupe_posts(all_posts)
    print(f"[ppomppu] total: {len(all_posts)} items")
    return all_posts


def dedupe_posts(posts: List[Post]) -> List[Post]:
    seen = set()
    uniq: List[Post] = []
    for p in posts:
        # URL에서 게시글 번호만 추출해서 중복 체크
        url_key = p.url
        if "number=" in p.url:
            match = re.search(r"number=(\d+)", p.url)
            if match:
                url_key = f"humoruniv_{match.group(1)}"
        elif "document_srl=" in p.url:
            match = re.search(r"document_srl=(\d+)", p.url)
            if match:
                url_key = f"fmkorea_{match.group(1)}"
        elif "read/" in p.url:
            match = re.search(r"read/(\d+)", p.url)
            if match:
                url_key = f"ruliweb_{match.group(1)}"
        elif "wr_id=" in p.url:
            match = re.search(r"wr_id=(\d+)", p.url)
            if match:
                url_key = f"etoland_{match.group(1)}"
        elif "board/webzine/2097/" in p.url:
            match = re.search(r"2097/(\d+)", p.url)
            if match:
                url_key = f"inven_{match.group(1)}"
        elif "No=" in p.url:
            match = re.search(r"No=(\d+)", p.url)
            if match:
                url_key = f"bobaedream_{match.group(1)}"
        elif "view.php" in p.url and "no=" in p.url:
            match = re.search(r"no=(\d+)", p.url)
            if match:
                url_key = f"ppomppu_{match.group(1)}"
        
        if url_key in seen:
            continue
        seen.add(url_key)
        uniq.append(p)
    return uniq

# ── 본문 페이지에서 썸네일 추출 ──────────────────────────────────

# 사이트별 본문 컨테이너 CSS 셀렉터 (게시글 상세 페이지용)
_CONTENT_SELECTORS: Dict[str, List[str]] = {
    "humoruniv": ["#cnts", "#wrap_img"],
    "ruliweb": ["div.view_content", "div.board_main_view"],
    "etoland": ["div#view_content", "td.mw_basic_view_content"],
    "inven": ["div#powerbbsContent", "div.contentBody"],
    "clien": ["div.post_article", "div.post_view"],
    "mlbpark": ["div#contentDetail", "div.ar_txt"],
    "ddanzi": ["div.xe_content", "div.read_content"],
    "bobaedream": ["div.bodyCont", "div.content02"],
    "ppomppu": ["td.board-contents"],
    "fmkorea": ["div.xe_content", "article"],
    "dcinside": ["div.write_div", "div.writing_view_box"],
    "damoang": ["div.fr-view", "div.view_content"],
    "dogdrip": ["div.xe_content"],
    "theqoo": ["div.xe_content"],
    "82cook": ["div.view_content", "div.post_content"],
    "slrclub": ["div#userct"],
}

# og:image에서 사이트 기본 이미지(콘텐츠가 아닌 것) 필터
_OG_DEFAULT_PATTERNS = (
    "headtitle", "default", "og_default", "og-default",
    "common/", "share_img", "share_icon", "logo", "favicon",
    "no_image", "noimage", "no-image",
)

def _is_valid_og_image(url: str) -> bool:
    """og:image가 실제 콘텐츠 이미지인지 확인 (사이트 기본 이미지 제외)."""
    if not url:
        return False
    url_lower = url.lower()
    if any(p in url_lower for p in _OG_DEFAULT_PATTERNS):
        return False
    # resize.php with empty src= parameter (e.g. etoland)
    if "resize.php" in url_lower and url_lower.rstrip().endswith("src="):
        return False
    return True

def _extract_first_media_from_content(soup: BeautifulSoup, site: str, base_url: str) -> Optional[str]:
    """본문 컨테이너에서 첫 번째 유효한 이미지/비디오 썸네일 URL을 추출."""
    content_el = None

    # 사이트별 셀렉터로 본문 영역 찾기
    if site in _CONTENT_SELECTORS:
        for selector in _CONTENT_SELECTORS[site]:
            el = soup.select_one(selector)
            if el:
                content_el = el
                break

    # 셀렉터 실패 시 og:image 메타 태그에서 추출
    if not content_el:
        og_img = soup.select_one('meta[property="og:image"]')
        if og_img:
            content = og_img.get("content", "")
            if content and content.startswith("http") and _is_valid_og_image(content):
                return content
        return None

    # 1) 이미지 태그에서 추출
    for img in content_el.find_all("img", limit=10):
        src = None
        # lazy-load 속성 우선
        for attr in _LAZY_ATTRS:
            val = img.get(attr)
            if val and val.startswith(("http", "/", "//")):
                src = val
                break
        if not src:
            src = img.get("src", "")

        if not src or src.startswith("data:"):
            continue

        # placeholder / UI 이미지 제외
        src_lower = src.lower()
        if any(p in src_lower for p in (
            "loading", "placeholder", "blank", "spacer", "pixel",
            "noimg", "no_img", "no_image", "no-image",
            "icon", "logo", "emoticon", "emot",
            "/newimg/", "/renew/images/", "/btn_", "btn_",
            "/board/level/", "/level/", "/img/rank/",
            "gallery_no", "thumb_no",
        )):
            continue

        # 아이콘/이모지 등 작은 이미지 제외
        width = img.get("width", "")
        height = img.get("height", "")
        if width and str(width).isdigit() and int(width) < 50:
            continue
        if height and str(height).isdigit() and int(height) < 50:
            continue

        # 절대 URL로 변환
        if src.startswith("//"):
            src = "https:" + src
        elif not src.startswith("http"):
            src = urljoin(base_url, src)

        return src

    # 2) 비디오 poster 속성에서 추출
    for video in content_el.find_all("video", limit=5):
        poster = video.get("poster", "")
        if poster:
            if poster.startswith("//"):
                poster = "https:" + poster
            elif not poster.startswith("http"):
                poster = urljoin(base_url, poster)
            return poster

    # 3) YouTube/동영상 iframe에서 썸네일 추출
    for iframe in content_el.find_all("iframe", limit=5):
        iframe_src = iframe.get("src", "")
        # YouTube embed → 썸네일 URL 변환
        yt_match = re.search(r'youtube\.com/embed/([a-zA-Z0-9_-]+)', iframe_src)
        if yt_match:
            return f"https://img.youtube.com/vi/{yt_match.group(1)}/hqdefault.jpg"
        yt_match = re.search(r'youtu\.be/([a-zA-Z0-9_-]+)', iframe_src)
        if yt_match:
            return f"https://img.youtube.com/vi/{yt_match.group(1)}/hqdefault.jpg"

    # 4) og:image fallback (사이트 기본 이미지 제외)
    og_img = soup.select_one('meta[property="og:image"]')
    if og_img:
        content = og_img.get("content", "")
        if content and content.startswith("http") and _is_valid_og_image(content):
            return content

    return None


async def extract_thumbnail_from_page(client: httpx.AsyncClient, url: str, site: str) -> Optional[str]:
    """게시글 본문 페이지를 fetch해서 첫 번째 이미지/비디오를 썸네일로 추출."""
    try:
        if site == "fmkorea":
            html = await _fetch_fmkorea_html(url)
        else:
            html = await fetch_html(client, url)
        if not html:
            return None
        soup = BeautifulSoup(html, "lxml")
        return _extract_first_media_from_content(soup, site, url)
    except Exception as e:
        print(f"[thumbnail] {site} error: {e}")
        return None


async def _fetch_fmkorea_html(url: str) -> Optional[str]:
    """curl_cffi 동기 호출을 스레드에서 실행 (Cloudflare 우회)"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fmkorea_fetch_sync, url)


def parse_slrclub(base_url: str, html: str) -> List[Post]:
    soup = BeautifulSoup(html, "lxml")
    posts: List[Post] = []

    table = soup.select_one("table")
    if not table:
        return posts

    for tr in table.select("tr"):
        # 공지글 제외
        if tr.select_one("td.list_notice"):
            continue

        num_td = tr.select_one("td.list_num")
        if not num_td:
            continue

        sbj_td = tr.select_one("td.sbj")
        if not sbj_td:
            continue

        title_link = sbj_td.select_one('a[href*="id=free"]')
        if not title_link:
            continue

        title = title_link.get_text(strip=True)
        href = title_link.get("href", "")

        if not title or not href or len(title) < 3:
            continue

        url = _abs(href, "https://www.slrclub.com/")

        # 댓글 수: 제목 뒤 [N] 텍스트에서 추출
        comments = None
        sbj_text = sbj_td.get_text(strip=True)
        m = re.search(r'\[(\d+)\]\s*$', sbj_text)
        if m:
            comments = int(m.group(1))

        author_td = tr.select_one("td.list_name")
        date_td = tr.select_one("td.list_date")
        vote_td = tr.select_one("td.list_vote")
        click_td = tr.select_one("td.list_click")

        author = author_td.get_text(strip=True) if author_td else None
        timestamp = date_td.get_text(strip=True) if date_td else None
        likes = _to_int_safe(vote_td.get_text(strip=True)) if vote_td else None
        views = _to_int_safe(click_td.get_text(strip=True)) if click_td else None

        thumbnail = _extract_thumbnail(tr, "https://www.slrclub.com/")
        posts.append(Post(site="slrclub", title=title, url=url, author=author, views=views, likes=likes, comments=comments, timestamp=timestamp, thumbnail=thumbnail))

    return dedupe_posts(posts)


SITES = [
    ("fmkorea",   "https://www.fmkorea.com/index.php?mid=humor&category=486622", parse_fmkorea),
    ("humoruniv", "https://web.humoruniv.com/board/humor/list.html?table=pds&st=day", parse_humoruniv),
    ("ruliweb",   "https://bbs.ruliweb.com/best/humor", parse_ruliweb),
    ("etoland",   "https://www.etoland.co.kr/bbs/board.php?bo_table=etohumor07&hit=y&sca=%C0%AF%B8%D3", parse_etoland),
    ("inven",     "https://www.inven.co.kr/board/webzine/2097?category=유머", parse_inven),
    # 새로 추가된 사이트들 (작동하는 것들만)
    ("clien",     "https://www.clien.net/service/board/park?&od=T31&category=0", parse_clien),
    ("mlbpark",   "https://mlbpark.donga.com/mp/b.php?p=1&b=bullpen&select=&query=&subselect=&subquery=&user=&site=&reply=&source=&pos=", parse_mlbpark),
    # ("damoang",   "https://damoang.net/free", parse_damoang),  # 403 Forbidden - 봇 차단
    ("ddanzi",    "https://www.ddanzi.com/free", parse_ddanzi),
    ("bobaedream", "https://www.bobaedream.co.kr/list?code=strange", parse_bobaedream),
    ("ppomppu",   "https://www.ppomppu.co.kr/zboard/zboard.php?id=freeboard&hotlist_flag=999", parse_ppomppu),
    ("slrclub",   "https://www.slrclub.com/bbs/zboard.php?id=free", parse_slrclub),
]

async def _crawl_site(
    client: httpx.AsyncClient,
    site_name: str,
    url: str,
    parser,
) -> List[Dict[str, Any]]:
    """단일 사이트 크롤링 (병렬 실행용)"""
    print(f"[{site_name}] GET {url}")
    try:
        if site_name == "damoang":
            posts = await crawl_damoang_multi_pages()
        elif site_name == "bobaedream":
            posts = await crawl_bobaedream_multi_pages()
        elif site_name == "fmkorea":
            posts = await crawl_fmkorea()
        elif site_name == "humoruniv":
            posts = await crawl_humoruniv_multi_pages()
        elif site_name == "ddanzi":
            posts = await crawl_ddanzi_multi_pages()
        elif site_name == "ppomppu":
            posts = await crawl_ppomppu_multi_pages()
        else:
            html = await fetch_html(client, url)
            if not html:
                print(f"[{site_name}] failed to fetch")
                return []
            posts = parser(url, html)
    except Exception as e:
        print(f"[{site_name}] error: {e}")
        return []

    collected = posts[:30]
    print(f"[{site_name}] parsed {len(posts)} items, collected {len(collected)} items")
    return [p.to_dict() for p in collected]


async def crawl_all() -> List[Dict[str, Any]]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        tasks = [
            _crawl_site(client, name, url, parser)
            for name, url, parser in SITES
        ]
        site_results = await asyncio.gather(*tasks, return_exceptions=True)

    results: List[Dict[str, Any]] = []
    for i, res in enumerate(site_results):
        if isinstance(res, Exception):
            print(f"[{SITES[i][0]}] exception: {res}")
        elif isinstance(res, list):
            results.extend(res)
    return results

def save_to_json(data: List[Dict[str, Any]], filename: str = "buzzit_posts.json"):
    """크롤링 결과를 JSON 파일로 저장"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            "metadata": {
                "total_posts": len(data),
                "collected_at": datetime.now().isoformat(),
                "sites": list(set(post["site"] for post in data))
            },
            "posts": data
        }, f, ensure_ascii=False, indent=2)
    print(f"Results saved to {filename}")

if __name__ == "__main__":
    data = asyncio.run(crawl_all())
    
    # 콘솔 출력
    for i, d in enumerate(data, 1):
        print(f"{i:03d}. [{d['site']}] {d['title']}  -> {d['url']}")
    
    # JSON 파일로 저장
    save_to_json(data)
