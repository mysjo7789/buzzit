#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import httpx
from bs4 import BeautifulSoup

async def debug_site(url: str, site_name: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=15.0)
            if response.status_code == 200:
                # 인코딩 처리
                if "humoruniv.com" in url:
                    html = response.content.decode("cp949", errors="ignore")
                else:
                    html = response.content.decode("utf-8", errors="ignore")
                
                soup = BeautifulSoup(html, "lxml")
                
                print(f"\n=== {site_name} HTML 구조 분석 ===")
                print(f"URL: {url}")
                print(f"HTML 길이: {len(html)}")
                
                # 링크들 찾기
                links = soup.find_all("a", href=True)
                print(f"\n총 링크 수: {len(links)}")
                
                # 게시글 관련 링크들만 필터링
                relevant_links = []
                for link in links:
                    href = link.get("href", "")
                    text = link.get_text(strip=True)
                    if len(text) > 5 and any(keyword in href for keyword in ["read.html", "document_srl", "board.php", "board/"]):
                        relevant_links.append((text, href))
                
                print(f"\n관련 링크 수: {len(relevant_links)}")
                for i, (text, href) in enumerate(relevant_links[:10]):
                    print(f"{i+1}. {text[:50]} -> {href}")
                
                # 테이블 구조 확인
                tables = soup.find_all("table")
                print(f"\n테이블 수: {len(tables)}")
                for i, table in enumerate(tables[:3]):
                    print(f"테이블 {i+1} 클래스: {table.get('class', 'None')}")
                    rows = table.find_all("tr")
                    print(f"  행 수: {len(rows)}")
                    if rows:
                        cells = rows[0].find_all(["td", "th"])
                        print(f"  첫 행 셀 수: {len(cells)}")
                
                # 리스트 구조 확인
                lists = soup.find_all(["ul", "ol"])
                print(f"\n리스트 수: {len(lists)}")
                for i, lst in enumerate(lists[:3]):
                    items = lst.find_all("li")
                    print(f"리스트 {i+1} 아이템 수: {len(items)}")
                    if items:
                        print(f"  첫 아이템 클래스: {items[0].get('class', 'None')}")
                
            else:
                print(f"{site_name}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"{site_name}: 에러 - {e}")

async def main():
    sites = [
        ("웃긴대학", "https://web.humoruniv.com/board/humor/list.html?table=pds&st=day"),
        ("에펨코리아", "https://www.fmkorea.com/index.php?mid=humor&sort_index=pop&order_type=desc"),
        ("루리웹", "https://bbs.ruliweb.com/community/board/300143?view_best=1"),
        ("이토랜드", "https://www.etoland.co.kr/bbs/board.php?bo_table=etohumor07&hit=y"),
        ("인벤", "https://www.inven.co.kr/board/webzine/2097?iskin=webzine"),
    ]
    
    for site_name, url in sites:
        await debug_site(url, site_name)
        await asyncio.sleep(2)  # 딜레이

if __name__ == "__main__":
    asyncio.run(main())
