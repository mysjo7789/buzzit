#!/usr/bin/env python3
"""Standalone crawler CLI for GitHub Actions.
Runs the full crawl cycle and outputs buzzit_posts.json.
"""
import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Add backend to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from core.crawler.main import (
    crawl_all,
    extract_thumbnail_from_page,
    DEFAULT_TIMEOUT,
)
import httpx


async def _fill_thumbnails(data: Dict[str, Any]):
    """썸네일이 없는 게시글의 본문에서 썸네일을 추출."""
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
                except Exception:
                    continue
        return count

    tasks = [_process_site(site, sp) for site, sp in by_site.items()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, int):
            filled += r

    print(f"[thumbnail] 완료: {filled}/{len(no_thumb)}개 썸네일 추출")


async def main():
    output_path = sys.argv[1] if len(sys.argv) > 1 else "buzzit_posts.json"

    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    print("크롤링 시작...")
    results = await crawl_all()

    data: Dict[str, Any] = {
        "metadata": {
            "total_posts": len(results),
            "collected_at": datetime.now().isoformat(),
            "sites": list(set(post["site"] for post in results))
        },
        "posts": results
    }

    print(f"크롤링 완료: {len(data['metadata']['sites'])}개 사이트에서 {len(results)}개 게시글 수집")

    await _fill_thumbnails(data)

    # Update count after thumbnail pass
    data["metadata"]["total_posts"] = len(data["posts"])

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"저장 완료: {output_path} ({len(results)}개 게시글)")


if __name__ == "__main__":
    asyncio.run(main())
