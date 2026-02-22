#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import httpx
from bs4 import BeautifulSoup

async def debug_single_site(url: str, site_name: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=15.0)
            if response.status_code == 200:
                html = response.content.decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "lxml")
                
                print(f"\n=== {site_name} 상세 분석 ===")
                
                # document_srl 링크들 찾기 (에펨코리아)
                if "fmkorea" in url:
                    doc_links = soup.find_all("a", href=lambda x: x and "document_srl" in x)
                    print(f"document_srl 링크 수: {len(doc_links)}")
                    for i, link in enumerate(doc_links[:5]):
                        print(f"{i+1}. {link.get_text(strip=True)[:50]} -> {link.get('href')}")
                
                # 루리웹 게시글 링크들 찾기
                if "ruliweb" in url:
                    board_links = soup.find_all("a", href=lambda x: x and "/community/board/300143/" in x)
                    print(f"게시글 링크 수: {len(board_links)}")
                    for i, link in enumerate(board_links[:5]):
                        print(f"{i+1}. {link.get_text(strip=True)[:50]} -> {link.get('href')}")
                
                # li 요소들 분석
                li_elements = soup.find_all("li")
                print(f"\n총 li 요소 수: {len(li_elements)}")
                
                # li 요소들의 클래스 분석
                li_classes = {}
                for li in li_elements:
                    classes = li.get("class", [])
                    if classes:
                        class_str = " ".join(classes)
                        li_classes[class_str] = li_classes.get(class_str, 0) + 1
                
                print("li 클래스별 개수:")
                for class_name, count in sorted(li_classes.items(), key=lambda x: x[1], reverse=True)[:10]:
                    print(f"  {class_name}: {count}")
                
                # 실제 게시글 링크가 있는 li 찾기
                content_li = []
                for li in li_elements:
                    links = li.find_all("a", href=True)
                    for link in links:
                        href = link.get("href", "")
                        text = link.get_text(strip=True)
                        if len(text) > 10 and any(keyword in href for keyword in ["document_srl", "board/300143/", "board.php"]):
                            content_li.append((li.get("class", []), text[:50], href))
                
                print(f"\n게시글 링크가 있는 li 요소 수: {len(content_li)}")
                for i, (classes, text, href) in enumerate(content_li[:5]):
                    print(f"{i+1}. 클래스: {classes} | 제목: {text} | 링크: {href}")
                
            else:
                print(f"{site_name}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"{site_name}: 에러 - {e}")

async def main():
    sites = [
        ("에펨코리아", "https://www.fmkorea.com/index.php?mid=humor&sort_index=pop&order_type=desc"),
        ("루리웹", "https://bbs.ruliweb.com/community/board/300143?view_best=1"),
    ]
    
    for site_name, url in sites:
        await debug_single_site(url, site_name)
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
