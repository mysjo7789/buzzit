"""피부 영역 추출 모듈."""

import cv2
import numpy as np


def extract_skin_region(image_rgb: np.ndarray, face_info: dict) -> np.ndarray:
    """
    얼굴 영역에서 피부 부분만 추출한다.
    HSV 색공간 기반 피부색 마스킹을 사용한다.

    Returns:
        피부 영역만 남은 RGB 이미지 (배경은 0)
    """
    x, y, w, h = face_info["x"], face_info["y"], face_info["w"], face_info["h"]

    # 얼굴 영역에 여유분 추가 (이마, 볼 포함)
    pad_x = int(w * 0.1)
    pad_y = int(h * 0.15)

    h_img, w_img = image_rgb.shape[:2]
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(w_img, x + w + pad_x)
    y2 = min(h_img, y + h + pad_y)

    face_crop = image_rgb[y1:y2, x1:x2]

    # HSV 기반 피부색 마스크
    hsv = cv2.cvtColor(face_crop, cv2.COLOR_RGB2HSV)

    # 피부색 범위 (넓게 잡음)
    lower_skin = np.array([0, 20, 50], dtype=np.uint8)
    upper_skin = np.array([30, 255, 255], dtype=np.uint8)

    mask = cv2.inRange(hsv, lower_skin, upper_skin)

    # 노이즈 제거
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # 마스크 적용
    skin = cv2.bitwise_and(face_crop, face_crop, mask=mask)

    return skin
