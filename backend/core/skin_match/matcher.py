"""
피부 분석 결과 → 연예인 매칭 모듈.

이미지의 실제 피부 Feature를 분석하여 결정론적으로 결과를 선택한다.
동일한 이미지는 항상 동일한 결과를 반환한다.
확률 분포: good 80%, bomb 20%
"""

import hashlib
from .detector import detect_face
from .extractor import extract_skin_region
from .analyzer import analyze_skin_features
from .celeb_data import GOOD_CELEBS, BOMB_CELEBS, GOOD_PROBABILITY, CelebResult


def _compute_image_hash(image_bytes: bytes, features: dict[str, float]) -> int:
    """이미지 바이트 + 피부 Feature로 결정론적 해시를 생성한다."""
    # 이미지 데이터의 MD5 + Feature 값을 조합
    img_hash = hashlib.md5(image_bytes).hexdigest()
    feature_str = "|".join(f"{k}:{v:.4f}" for k, v in sorted(features.items()))
    combined = f"{img_hash}|{feature_str}"
    return int(hashlib.sha256(combined.encode()).hexdigest(), 16)


def match_skin(image_bytes: bytes) -> CelebResult:
    """
    이미지를 분석하여 가장 닮은 연예인을 반환한다.

    1. 얼굴 검출
    2. 피부 영역 추출
    3. 피부 Feature 계산
    4. 해시 기반 결정론적 결과 선택 (80% good / 20% bomb)

    Raises:
        ValueError: 얼굴 미검출, 너무 어두움, 너무 흐림 등
    """
    # Step 1-3: 실제 AI 분석 수행
    image_rgb, face_info = detect_face(image_bytes)
    skin_region = extract_skin_region(image_rgb, face_info)
    features = analyze_skin_features(skin_region)

    # Step 4: 결정론적 결과 선택
    hash_val = _compute_image_hash(image_bytes, features)

    # 확률 분배: 0~99 범위에서 0~79는 good, 80~99는 bomb
    bucket = hash_val % 100

    if bucket < int(GOOD_PROBABILITY * 100):
        # good 결과 중 하나 선택
        idx = hash_val % len(GOOD_CELEBS)
        return GOOD_CELEBS[idx]
    else:
        # bomb 결과 중 하나 선택
        idx = hash_val % len(BOMB_CELEBS)
        return BOMB_CELEBS[idx]
