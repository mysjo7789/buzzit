#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import httpx
from bs4 import BeautifulSoup

async def analyze_site(url: str, site_name: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"\n=== {site_name} 분석 ===")
            print(f"URL: {url}")
            
            response = await client.get(url, headers=headers, timeout=15.0)
            if response.status_code == 200:
                html = response.content.decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "lxml")
                
                print(f"HTML 길이: {len(html)}")
                
                # 모든 링크 찾기
                links = soup.find_all("a", href=True)
                print(f"총 링크 수: {len(links)}")
                
                # 게시글 관련 링크들 찾기
                article_links = []
                for link in links:
                    href = link.get("href", "")
                    text = link.get_text(strip=True)
                    
                    # 사이트별 게시글 링크 패턴
                    if any(pattern in href for pattern in ["bullpen", "read.php", "free/", "b.php"]):
                        if len(text) > 10:
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
                
                # 게시글 제목과 메타 정보 찾기
                print(f"\n=== 게시글 정보 분석 ===")
                
                # 제목 찾기
                title_selectors = ["h1", "h2", "h3", ".title", ".subject", ".post_title"]
                for selector in title_selectors:
                    title_elem = soup.select_one(selector)
                    if title_elem:
                        print(f"제목 ({selector}): {title_elem.get_text(strip=True)[:100]}")
                        break
                
                # 조회수, 추천, 댓글 수 찾기
                meta_patterns = ["조회", "추천", "댓글", "view", "recommend", "reply", "comment"]
                for pattern in meta_patterns:
                    elements = soup.find_all(text=lambda text: text and pattern in text)
                    if elements:
                        print(f"메타 정보 ({pattern}): {elements[0][:50]}")
                
            else:
                print(f"HTTP {response.status_code}")
                
        except Exception as e:
            print(f"에러: {e}")

async def main():
    sites = [
        ("MLB파크", "https://mlbpark.donga.com/mp/b.php?p=1&b=bullpen&id=202508240108151053&select=&query=&subselect=&subquery=&user=&site=&reply=&source=&pos=&sig=h6jjHl2Y6hRRKfX2hej9RY-Aghlq"),
        ("82cook", "https://www.82cook.com/entiz/read.php?bn=15&num=4075072"),
        ("다모앙", "https://damoang.net/free/4763008"),
        ("딴지일보", "https://www.ddanzi.com/free/856752821"),
    ]
    
    for site_name, url in sites:
        await analyze_site(url, site_name)
        await asyncio.sleep(2)  # 딜레이

if __name__ == "__main__":
    asyncio.run(main())
