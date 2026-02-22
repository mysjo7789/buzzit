#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
On-demand 게시글 본문 추출 모듈.
사이트별 CSS 셀렉터를 우선 시도하고, 실패 시 trafilatura로 fallback.
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup, Tag

try:
    import trafilatura
except ImportError:
    trafilatura = None

from core.crawler.main import fetch_html, HEADERS, DEFAULT_TIMEOUT

# ── 결과 모델 ──────────────────────────────────────────────────────

@dataclass
class ExtractedContent:
    html_content: str
    text_content: str
    images: List[str] = field(default_factory=list)
    source_url: str = ""


# ── 사이트별 본문 컨테이너 CSS 셀렉터 ──────────────────────────────
# 실제 사이트 HTML 구조를 검증하여 작성 (2025.02)

SITE_CONTENT_SELECTORS: Dict[str, List[str]] = {
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
}

# HTML 새니타이징 허용 태그/속성
ALLOWED_TAGS = {
    "p", "br", "img", "strong", "em", "b", "i",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote", "a", "div", "span",
    "table", "tr", "td", "th", "thead", "tbody",
    "figure", "figcaption", "video", "source",
}
ALLOWED_ATTRS = {
    "img": {"src", "alt", "loading", "referrerpolicy"},
    "a": {"href"},
    "video": {"src", "poster", "controls", "autoplay", "loop", "muted", "playsinline"},
    "source": {"src", "type"},
    "*": {"style"},  # 기본 인라인 스타일 허용 (새니타이징 후)
}

# 허용하는 CSS 속성 (XSS-safe한 것만)
ALLOWED_CSS_PROPS = {
    "text-align", "font-size", "font-weight", "font-style",
    "color", "background-color",
    "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
    "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
    "width", "max-width", "height",
    "display", "text-decoration", "line-height", "letter-spacing",
    "border", "border-bottom", "border-top",
}

# lazy-load 속성들 (이미지 + 비디오 공통)
LAZY_ATTRS = ["data-src", "data-original", "data-lazy-src", "data-lazy", "data-actualsrc"]

MAX_CONTENT_SIZE = 500_000  # 500KB
MAX_IMAGES = 50

# 이미지 placeholder 패턴 (lazy-load 시 실제 이미지가 아닌 src)
_PLACEHOLDER_PATTERNS = ("loading", "placeholder", "blank", "spacer", "pixel")


# ── 메인 추출 함수 ────────────────────────────────────────────────

async def extract_content(url: str, site: Optional[str] = None) -> Optional[ExtractedContent]:
    """
    URL에서 본문 콘텐츠를 추출.
    1. 페이지 HTML fetch
    2. 사이트별 셀렉터로 본문 추출 시도
    3. 실패 시 trafilatura fallback
    4. HTML 새니타이징 + 이미지/비디오 처리
    """
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        html = await fetch_html(client, url)

    if not html:
        return None

    soup = BeautifulSoup(html, "lxml")
    content_element = None

    # 1) 사이트별 셀렉터 시도
    if site and site in SITE_CONTENT_SELECTORS:
        for selector in SITE_CONTENT_SELECTORS[site]:
            content_element = soup.select_one(selector)
            if content_element and _has_content(content_element):
                break
            content_element = None

    # 2) 사이트 미지정 시 모든 셀렉터 시도
    if not content_element:
        for selectors in SITE_CONTENT_SELECTORS.values():
            for selector in selectors:
                el = soup.select_one(selector)
                if el and _has_content(el, min_text=50):
                    content_element = el
                    break
            if content_element:
                break

    # 3) trafilatura fallback
    if not content_element and trafilatura:
        extracted_html = trafilatura.extract(
            html,
            output_format="html",
            include_images=True,
            include_links=True,
            favor_recall=True,
        )
        if extracted_html:
            text = trafilatura.extract(html, output_format="txt") or ""
            sanitized = _sanitize_html(extracted_html, url)
            images = _extract_image_urls(sanitized)
            return ExtractedContent(
                html_content=sanitized[:MAX_CONTENT_SIZE],
                text_content=text[:MAX_CONTENT_SIZE],
                images=images[:MAX_IMAGES],
                source_url=url,
            )

    if not content_element:
        return None

    # 이미지/비디오 URL 처리
    _resolve_media(content_element, url)

    # HTML 새니타이징
    raw_html = str(content_element)
    sanitized = _sanitize_html(raw_html, url)
    images = _extract_image_urls(sanitized)

    # 텍스트 추출
    text = content_element.get_text("\n", strip=True)

    return ExtractedContent(
        html_content=sanitized[:MAX_CONTENT_SIZE],
        text_content=text[:MAX_CONTENT_SIZE],
        images=images[:MAX_IMAGES],
        source_url=url,
    )


# ── 헬퍼 함수들 ───────────────────────────────────────────────────

def _has_content(element: Tag, min_text: int = 10) -> bool:
    """요소에 유의미한 콘텐츠(텍스트 or 이미지/비디오)가 있는지 확인."""
    text_len = len(element.get_text(strip=True))
    if text_len > min_text:
        return True
    # 이미지나 비디오가 있으면 텍스트가 짧아도 유효
    media_count = len(element.find_all("img")) + len(element.find_all("video"))
    return media_count > 0


def _is_placeholder_src(src: str) -> bool:
    """lazy-load placeholder 이미지인지 확인."""
    if not src:
        return True
    src_lower = src.lower()
    return any(p in src_lower for p in _PLACEHOLDER_PATTERNS) or src.startswith("data:")


def _resolve_media(soup_element: Tag, base_url: str) -> None:
    """이미지/비디오 태그의 URL을 처리 (lazy-load, 상대경로 등)."""
    # 이미지 처리
    for img in soup_element.find_all("img"):
        real_src = None
        for attr in LAZY_ATTRS:
            val = img.get(attr)
            if val and val.startswith(("http", "/", "//")):
                real_src = val
                break

        src = img.get("src", "")
        # placeholder src이고 lazy-load에 실제 URL이 있으면 교체
        if real_src and (_is_placeholder_src(src) or not src):
            src = real_src
        elif not src:
            img.decompose()
            continue

        if src.startswith("data:"):
            img.decompose()
            continue

        # protocol-relative URL 처리 (//example.com/img.jpg)
        if src.startswith("//"):
            src = "https:" + src
        elif not src.startswith("http"):
            src = urljoin(base_url, src)

        img["src"] = src
        img["loading"] = "lazy"
        img["referrerpolicy"] = "no-referrer"

        # 불필요한 속성 제거
        for attr in LAZY_ATTRS + ["width", "height", "onclick", "onerror"]:
            if img.has_attr(attr):
                del img[attr]

    # 비디오 처리 (인벤 등에서 data-src 사용)
    for video in soup_element.find_all("video"):
        src = video.get("src", "")
        if not src:
            for attr in LAZY_ATTRS:
                val = video.get(attr)
                if val and val.startswith(("http", "/", "//")):
                    src = val
                    break

        if src:
            if src.startswith("//"):
                src = "https:" + src
            elif not src.startswith("http"):
                src = urljoin(base_url, src)
            video["src"] = src

        video["controls"] = ""
        video["playsinline"] = ""
        video["loading"] = "lazy"
        video["referrerpolicy"] = "no-referrer"

        # lazy 속성 정리
        for attr in LAZY_ATTRS + ["onclick", "onerror"]:
            if video.has_attr(attr):
                del video[attr]

    # source 태그 처리 (video 내부)
    for source in soup_element.find_all("source"):
        src = source.get("src", "")
        if src and not src.startswith("http"):
            if src.startswith("//"):
                src = "https:" + src
            else:
                src = urljoin(base_url, src)
            source["src"] = src


def _sanitize_html(html: str, base_url: str = "") -> str:
    """화이트리스트 기반 HTML 새니타이징."""
    soup = BeautifulSoup(html, "lxml")

    # script, style, iframe, noscript 완전 제거
    for tag in soup.find_all(["script", "style", "iframe", "noscript", "object", "embed", "form", "input"]):
        tag.decompose()

    # 허용되지 않은 태그 처리: 태그를 벗기고 내용만 남김
    for tag in soup.find_all(True):
        if tag.name not in ALLOWED_TAGS:
            tag.unwrap()

    # 허용되지 않은 속성 제거 + 인라인 스타일 새니타이징
    global_allowed = ALLOWED_ATTRS.get("*", set())
    for tag in soup.find_all(True):
        tag_allowed = ALLOWED_ATTRS.get(tag.name, set()) | global_allowed
        attrs_to_remove = [attr for attr in tag.attrs if attr not in tag_allowed]
        for attr in attrs_to_remove:
            del tag[attr]

        # 인라인 스타일 새니타이징: 허용된 CSS 속성만 남김
        if tag.get("style"):
            tag["style"] = _sanitize_css(tag["style"])
            if not tag["style"]:
                del tag["style"]

    # a 태그 href 처리: javascript: 제거, 상대 URL → 절대 URL
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href or href.lower().startswith("javascript:"):
            a.unwrap()  # 위험한 링크는 태그 벗기고 텍스트만 남김
        elif base_url and not href.startswith(("http", "mailto:", "#")):
            a["href"] = urljoin(base_url, href)

    # body 태그 안의 내용만 반환
    body = soup.find("body")
    result = "".join(str(child) for child in body.children) if body else str(soup)

    # HTML 주석 제거
    result = re.sub(r'<!--.*?-->', '', result, flags=re.DOTALL)
    # 빈 태그 정리
    result = re.sub(r'<(p|div|span)>\s*</\1>', '', result)
    # 연속 줄바꿈 정리
    result = re.sub(r'(<br\s*/?>){3,}', '<br><br>', result)

    return result.strip()


def _sanitize_css(style: str) -> str:
    """인라인 CSS에서 허용된 속성만 남김. url(), expression() 등 위험 값 제거."""
    safe_parts = []
    for declaration in style.split(";"):
        declaration = declaration.strip()
        if not declaration or ":" not in declaration:
            continue
        prop, _, value = declaration.partition(":")
        prop = prop.strip().lower()
        value = value.strip()
        # 위험한 CSS 값 차단
        if any(danger in value.lower() for danger in ("url(", "expression(", "javascript:", "import")):
            continue
        if prop in ALLOWED_CSS_PROPS:
            safe_parts.append(f"{prop}: {value}")
    return "; ".join(safe_parts)


def _extract_image_urls(html: str) -> List[str]:
    """HTML에서 이미지 URL 목록 추출."""
    soup = BeautifulSoup(html, "lxml")
    urls = []
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if src and src.startswith("http"):
            urls.append(src)
    return urls
