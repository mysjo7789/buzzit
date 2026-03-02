#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MBTI OG 이미지 생성 스크립트"""

from PIL import Image, ImageDraw, ImageFont
import os

# 설정
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
WIDTH = 1200
HEIGHT = 630

# 색상
BG_START = (255, 247, 237)  # #FFF7ED
BG_END = (255, 237, 213)    # #FFEDD5
TEXT_DARK = (17, 24, 39)    # #111827
TEXT_ORANGE = (249, 115, 22)  # #F97316
TEXT_GRAY = (107, 114, 128)  # #6B7280
TEXT_LIGHT_GRAY = (156, 163, 175)  # #9CA3AF

# MBTI 유형 데이터
MBTI_TYPES = {
    'INTJ': {'emoji': '🧠', 'title': '전략가', 'subtitle': '완벽주의 설계자'},
    'INTP': {'emoji': '🤔', 'title': '논리학자', 'subtitle': '호기심 많은 사색가'},
    'ENTJ': {'emoji': '👑', 'title': '지휘관', 'subtitle': '타고난 리더'},
    'ENTP': {'emoji': '💡', 'title': '변론가', 'subtitle': '아이디어 뱅크'},
    'INFJ': {'emoji': '🌙', 'title': '옹호자', 'subtitle': '신비로운 조언자'},
    'INFP': {'emoji': '🌸', 'title': '중재자', 'subtitle': '꿈꾸는 이상주의자'},
    'ENFJ': {'emoji': '✨', 'title': '선도자', 'subtitle': '타고난 멘토'},
    'ENFP': {'emoji': '🎉', 'title': '활동가', 'subtitle': '자유로운 영혼'},
    'ISTJ': {'emoji': '📋', 'title': '현실주의자', 'subtitle': '신뢰할 수 있는 실행자'},
    'ISFJ': {'emoji': '💝', 'title': '수호자', 'subtitle': '따뜻한 지원자'},
    'ESTJ': {'emoji': '⚖️', 'title': '경영자', 'subtitle': '실용적 조직가'},
    'ESFJ': {'emoji': '🤝', 'title': '집정관', 'subtitle': '사교적 조력자'},
    'ISTP': {'emoji': '🔧', 'title': '장인', 'subtitle': '만능 해결사'},
    'ISFP': {'emoji': '🎨', 'title': '모험가', 'subtitle': '자유로운 예술가'},
    'ESTP': {'emoji': '⚡', 'title': '사업가', 'subtitle': '에너제틱 행동파'},
    'ESFP': {'emoji': '🎊', 'title': '연예인', 'subtitle': '분위기 메이커'}
}


def create_gradient_background():
    """그라데이션 배경 생성"""
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    for y in range(HEIGHT):
        r = int(BG_START[0] + (BG_END[0] - BG_START[0]) * y / HEIGHT)
        g = int(BG_START[1] + (BG_END[1] - BG_START[1]) * y / HEIGHT)
        b = int(BG_START[2] + (BG_END[2] - BG_START[2]) * y / HEIGHT)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    return img, draw


def get_font(size):
    """폰트 가져오기"""
    try:
        # macOS 기본 폰트 시도
        return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Unicode.ttf', size)
    except:
        try:
            return ImageFont.truetype('/Library/Fonts/Arial Unicode.ttf', size)
        except:
            # 폴백
            return ImageFont.load_default()


def create_main_image():
    """MBTI 메인 페이지 이미지 생성"""
    img, draw = create_gradient_background()

    # 이모지는 텍스트로 대체 (PIL에서 이모지 렌더링 어려움)
    emoji_font = get_font(140)
    title_font = get_font(64)
    subtitle_font = get_font(42)
    info_font = get_font(32)
    footer_font = get_font(28)

    # 이모지
    emoji = '🧠'
    bbox = draw.textbbox((0, 0), emoji, font=emoji_font)
    emoji_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - emoji_width) // 2, 80), emoji, font=emoji_font, fill=TEXT_DARK)

    # 제목
    title = 'MBTI 성격 테스트'
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - title_width) // 2, 280), title, font=title_font, fill=TEXT_DARK)

    # 부제목
    subtitle = '당신의 진짜 성격을 찾아보세요'
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - subtitle_width) // 2, 370), subtitle, font=subtitle_font, fill=TEXT_ORANGE)

    # 정보
    info = '16개 질문 • 2-3분 소요'
    bbox = draw.textbbox((0, 0), info, font=info_font)
    info_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - info_width) // 2, 440), info, font=info_font, fill=TEXT_GRAY)

    # 푸터
    footer = 'bzibzi.com/mbti'
    bbox = draw.textbbox((0, 0), footer, font=footer_font)
    footer_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - footer_width) // 2, 560), footer, font=footer_font, fill=TEXT_LIGHT_GRAY)

    return img


def create_type_image(mbti_type, data):
    """MBTI 유형별 이미지 생성"""
    img, draw = create_gradient_background()

    emoji_font = get_font(120)
    type_font = get_font(80)
    title_font = get_font(48)
    subtitle_font = get_font(36)
    footer_font = get_font(28)

    # 이모지
    emoji = data['emoji']
    bbox = draw.textbbox((0, 0), emoji, font=emoji_font)
    emoji_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - emoji_width) // 2, 80), emoji, font=emoji_font, fill=TEXT_DARK)

    # MBTI 타입
    bbox = draw.textbbox((0, 0), mbti_type, font=type_font)
    type_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - type_width) // 2, 250), mbti_type, font=type_font, fill=TEXT_DARK)

    # 제목
    title = data['title']
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - title_width) // 2, 350), title, font=title_font, fill=TEXT_ORANGE)

    # 부제목
    subtitle = data['subtitle']
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - subtitle_width) // 2, 420), subtitle, font=subtitle_font, fill=TEXT_GRAY)

    # 푸터
    footer = 'Buzzit MBTI 테스트'
    bbox = draw.textbbox((0, 0), footer, font=footer_font)
    footer_width = bbox[2] - bbox[0]
    draw.text(((WIDTH - footer_width) // 2, 560), footer, font=footer_font, fill=TEXT_LIGHT_GRAY)

    return img


def main():
    """메인 실행 함수"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 메인 이미지 생성
    print('메인 이미지 생성 중...')
    main_img = create_main_image()
    main_path = os.path.join(OUTPUT_DIR, 'og-mbti.png')
    main_img.save(main_path, 'PNG', optimize=True, quality=95)
    print(f'✓ {main_path}')

    # 각 유형별 이미지 생성
    print(f'\n16개 유형 이미지 생성 중...')
    for mbti_type, data in MBTI_TYPES.items():
        type_img = create_type_image(mbti_type, data)
        type_path = os.path.join(OUTPUT_DIR, f'og-mbti-{mbti_type.lower()}.png')
        type_img.save(type_path, 'PNG', optimize=True, quality=95)
        print(f'✓ {type_path} ({data["title"]})')

    print(f'\n완료! 총 17개 이미지 생성됨')


if __name__ == '__main__':
    main()
