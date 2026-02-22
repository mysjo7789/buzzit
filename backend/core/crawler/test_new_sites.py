#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import httpx
from bs4 import BeautifulSoup

async def test_site(url: str, site_name: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"\n=== {site_name} 테스트 ===")
            print(f"URL: {url}")
            
            response = await client.get(url, headers=headers, timeout=15.0)
            if response.status_code == 200:
                html = response.content.decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "lxml")
                
                print(f"HTML 길이: {len(html)}")
                
                # 게시글 링크들 찾기
                links = soup.find_all("a", href=True)
                print(f"총 링크 수: {len(links)}")
                
                # 사이트별 게시글 링크 패턴
                patterns = {
                    "dcinside": "gall.dcinside.com",
                    "clien": "clien.net",
                    "ppomppu": "ppomppu.co.kr",
                    "dogdrip": "dogdrip.net",
                    "theqoo": "theqoo.net"
                }
                
                pattern = patterns.get(site_name.lower(), "")
                if pattern:
                    article_links = []
                    for link in links:
                        href = link.get("href", "")
                        text = link.get_text(strip=True)
                        if pattern in href and len(text) > 10:
                            article_links.append((text[:50], href))
                    
                    print(f"게시글 링크 수: {len(article_links)}")
                    for i, (text, href) in enumerate(article_links[:5]):
                        print(f"{i+1}. {text} -> {href}")
                
                # CSS 클래스 분석
                classes = {}
                for element in soup.find_all(class_=True):
                    for class_name in element.get("class", []):
                        classes[class_name] = classes.get(class_name, 0) + 1
                
                print(f"\n주요 CSS 클래스들:")
                for class_name, count in sorted(classes.items(), key=lambda x: x[1], reverse=True)[:10]:
                    print(f"  {class_name}: {count}")
                
            else:
                print(f"HTTP {response.status_code}")
                
        except Exception as e:
            print(f"에러: {e}")

async def main():
    sites = [
        ("디시인사이드", "https://gall.dcinside.com/board/lists/?id=humor&sort_type=N&search_head=&page=1"),
        ("클리앙", "https://www.clien.net/board/recommend"),
        ("뽐뿌", "https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu&page=1&divnum=20&category=2&search_type=subject&keyword="),
        ("개드립", "https://www.dogdrip.net/index.php?mid=humor&page=1"),
        ("더쿠", "https://theqoo.net/index.php?mid=humor&page=1"),
    ]
    
    for site_name, url in sites:
        await test_site(url, site_name)
        await asyncio.sleep(2)  # 딜레이

if __name__ == "__main__":
    asyncio.run(main())
