#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import httpx
from bs4 import BeautifulSoup

async def debug_fmkorea():
    url = "https://www.fmkorea.com/index.php?mid=humor&sort_index=pop&order_type=desc"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=15.0)
            if response.status_code == 200:
                html = response.content.decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "lxml")
                
                print(f"=== 에펨코리아 인기글 게시판 분석 ===")
                print(f"URL: {url}")
                print(f"HTML 길이: {len(html)}")
                
                # document_srl 링크들 찾기
                doc_links = soup.find_all("a", href=lambda x: x and "document_srl" in x)
                print(f"\ndocument_srl 링크 수: {len(doc_links)}")
                
                # 실제 게시글 링크들만 필터링
                article_links = []
                for link in doc_links:
                    href = link.get("href", "")
                    text = link.get_text(strip=True)
                    # 공지사항이나 메뉴 링크 제외
                    if (len(text) > 5 and 
                        not text.startswith("추천") and 
                        not "공지" in text and
                        not "규정" in text and
                        "document_srl=" in href):
                        article_links.append((text, href))
                
                print(f"\n실제 게시글 링크 수: {len(article_links)}")
                for i, (text, href) in enumerate(article_links[:10]):
                    print(f"{i+1}. {text[:50]} -> {href}")
                
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
                
                print("\nli 클래스별 개수 (상위 10개):")
                for class_name, count in sorted(li_classes.items(), key=lambda x: x[1], reverse=True)[:10]:
                    print(f"  {class_name}: {count}")
                
                # 게시글 링크가 있는 li 찾기
                content_li = []
                for li in li_elements:
                    links = li.find_all("a", href=True)
                    for link in links:
                        href = link.get("href", "")
                        text = link.get_text(strip=True)
                        if (len(text) > 10 and 
                            "document_srl=" in href and
                            not text.startswith("추천") and
                            not "공지" in text):
                            content_li.append((li.get("class", []), text[:50], href))
                
                print(f"\n게시글 링크가 있는 li 요소 수: {len(content_li)}")
                for i, (classes, text, href) in enumerate(content_li[:5]):
                    print(f"{i+1}. 클래스: {classes} | 제목: {text} | 링크: {href}")
                
                # 특정 클래스의 li 요소들 확인
                best_li = soup.select("li.li_best2_pop0")
                print(f"\nli_best2_pop0 클래스 li 수: {len(best_li)}")
                for i, li in enumerate(best_li[:3]):
                    links = li.find_all("a", href=True)
                    for link in links:
                        if "document_srl=" in link.get("href", ""):
                            print(f"{i+1}. {link.get_text(strip=True)[:50]} -> {link.get('href')}")
                
            else:
                print(f"HTTP {response.status_code}")
                
        except Exception as e:
            print(f"에러: {e}")

if __name__ == "__main__":
    asyncio.run(debug_fmkorea())
