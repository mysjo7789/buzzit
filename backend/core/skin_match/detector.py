"""얼굴 검출 모듈 - OpenCV Haar Cascade + MediaPipe Tasks 기반."""

import os
import cv2
import numpy as np

# MediaPipe Tasks API (0.10.x)
_face_detector = None


def _get_face_detector():
    """MediaPipe FaceDetector 싱글톤을 반환한다."""
    global _face_detector
    if _face_detector is not None:
        return _face_detector

    try:
        import mediapipe as mp
        from mediapipe.tasks import BaseOptions
        vision = getattr(mp.tasks, 'vision')

        # 모델 다운로드 (최초 1회) - Leapcell 등 read-only FS 대응
        model_path = os.path.join(
            "/tmp", "blaze_face_short_range.tflite"
        )
        if not os.path.exists(model_path):
            import urllib.request
            url = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
            urllib.request.urlretrieve(url, model_path)

        options = vision.FaceDetectorOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            min_detection_confidence=0.5,
        )
        _face_detector = vision.FaceDetector.create_from_options(options)
        return _face_detector
    except Exception:
        return None


def _detect_with_mediapipe(rgb: np.ndarray) -> list[dict]:
    """MediaPipe Tasks로 얼굴 검출을 시도한다."""
    import mediapipe as mp

    detector = _get_face_detector()
    if detector is None:
        return []

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_image)

    faces = []
    h_img, w_img = rgb.shape[:2]
    for detection in result.detections:
        bbox = detection.bounding_box
        faces.append({
            "x": max(0, bbox.origin_x),
            "y": max(0, bbox.origin_y),
            "w": min(bbox.width, w_img - bbox.origin_x),
            "h": min(bbox.height, h_img - bbox.origin_y),
        })
    return faces


def _detect_with_opencv(gray: np.ndarray) -> list[dict]:
    """OpenCV Haar Cascade로 얼굴 검출 (폴백)."""
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    detections = face_cascade.detectMultiScale(
        gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30)
    )
    faces = []
    for (x, y, w, h) in detections:
        faces.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})
    return faces


def detect_face(image_bytes: bytes) -> tuple[np.ndarray, dict]:
    """
    이미지에서 얼굴을 검출한다.

    Returns:
        (image_rgb, face_info) 튜플

    Raises:
        ValueError: 얼굴을 찾을 수 없거나 이미지 품질 문제
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("invalid_format")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 밝기 검사
    mean_brightness = np.mean(gray)
    if mean_brightness < 30:
        raise ValueError("too_dark")

    # 흐림 검사
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 15:
        raise ValueError("too_blurry")

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # MediaPipe 시도 → OpenCV 폴백
    faces = _detect_with_mediapipe(rgb)
    if not faces:
        faces = _detect_with_opencv(gray)

    if not faces:
        raise ValueError("no_face")

    # 가장 큰 얼굴 선택
    face_info = max(faces, key=lambda f: f["w"] * f["h"])

    return rgb, face_info
