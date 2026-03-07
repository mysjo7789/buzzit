"""피부 Feature 분석 모듈."""

import cv2
import numpy as np


def analyze_skin_features(skin_region: np.ndarray) -> dict[str, float]:
    """
    피부 영역에서 5가지 Feature를 계산한다.

    Returns:
        {
            "brightness": 0~1,
            "redness": 0~1,
            "texture": 0~1,
            "smoothness": 0~1,
            "tone_uniformity": 0~1,
        }
    """
    # 피부 픽셀만 추출 (검은색 배경 제외)
    mask = np.any(skin_region > 0, axis=2)
    if mask.sum() < 100:
        # 피부 영역이 너무 작으면 기본값 반환
        return {
            "brightness": 0.5,
            "redness": 0.5,
            "texture": 0.5,
            "smoothness": 0.5,
            "tone_uniformity": 0.5,
        }

    skin_pixels = skin_region[mask]

    # 1. Brightness (L*a*b* 색공간의 L 채널)
    lab = cv2.cvtColor(skin_region, cv2.COLOR_RGB2LAB)
    l_channel = lab[:, :, 0][mask].astype(float)
    brightness = np.mean(l_channel) / 255.0

    # 2. Redness (a* 채널 - 붉은기)
    a_channel = lab[:, :, 1][mask].astype(float)
    redness = np.clip((np.mean(a_channel) - 128) / 50 + 0.5, 0, 1)

    # 3. Texture (Laplacian variance - 피부결)
    gray = cv2.cvtColor(skin_region, cv2.COLOR_RGB2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    texture_vals = np.abs(laplacian[mask])
    texture_raw = np.mean(texture_vals)
    texture = np.clip(texture_raw / 50.0, 0, 1)

    # 4. Smoothness (Gaussian blur와 원본의 차이가 작을수록 매끈함)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    diff = np.abs(gray.astype(float) - blurred.astype(float))
    diff_vals = diff[mask]
    smoothness = 1.0 - np.clip(np.mean(diff_vals) / 30.0, 0, 1)

    # 5. Tone Uniformity (색상 표준편차가 낮을수록 균일)
    r_vals = skin_pixels[:, 0].astype(float)
    g_vals = skin_pixels[:, 1].astype(float)
    b_vals = skin_pixels[:, 2].astype(float)
    std_r = np.std(r_vals)
    std_g = np.std(g_vals)
    std_b = np.std(b_vals)
    avg_std = (std_r + std_g + std_b) / 3.0
    tone_uniformity = 1.0 - np.clip(avg_std / 60.0, 0, 1)

    return {
        "brightness": round(float(brightness), 4),
        "redness": round(float(redness), 4),
        "texture": round(float(texture), 4),
        "smoothness": round(float(smoothness), 4),
        "tone_uniformity": round(float(tone_uniformity), 4),
    }
