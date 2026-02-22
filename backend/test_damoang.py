#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.crawler.main import crawl_damoang_multi_pages

async def test_damoang():
    print("다모앙 멀티페이지 크롤링 테스트...")
    posts = await crawl_damoang_multi_pages()
    
    print(f"\n총 수집된 게시글: {len(posts)}개")
    print("\n=== 상위 10개 게시글 ===")
    for i, post in enumerate(posts[:10], 1):
        print(f"{i:2d}. {post.title}")
        print(f"    조회수: {post.views}, 추천수: {post.likes}, 댓글수: {post.comments}")
        print(f"    URL: {post.url}")
        print()

if __name__ == "__main__":
    asyncio.run(test_damoang())
