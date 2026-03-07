"""연예인 피부 데이터 및 결과 정의."""

from typing import TypedDict

class CelebResult(TypedDict):
    id: str
    name: str
    type: str  # "good" | "bomb"
    title: str


CELEB_RESULTS: list[CelebResult] = [
    # 좋은 피부 연예인 (여자 6명)
    {"id": "wonyoung", "name": "장원영", "type": "good", "title": "아이돌 피부 타입"},
    {"id": "karina", "name": "카리나", "type": "good", "title": "글래스 스킨 타입"},
    {"id": "sullyoon", "name": "설윤", "type": "good", "title": "베이비 스킨 타입"},
    {"id": "minji", "name": "민지", "type": "good", "title": "클린 스킨 타입"},
    {"id": "jennie", "name": "제니", "type": "good", "title": "모델 피부 타입"},
    {"id": "gyuri", "name": "장규리", "type": "good", "title": "투명 피부 타입"},
    # 좋은 피부 연예인 (남자 6명)
    {"id": "chaeunwoo", "name": "차은우", "type": "good", "title": "아이돌 피부 타입"},
    {"id": "rowoon", "name": "로운", "type": "good", "title": "글래스 스킨 타입"},
    {"id": "songkang", "name": "송강", "type": "good", "title": "클린 스킨 타입"},
    {"id": "parkbogum", "name": "박보검", "type": "good", "title": "베이비 스킨 타입"},
    {"id": "junghaein", "name": "정해인", "type": "good", "title": "모델 피부 타입"},
    {"id": "byeonwooseok", "name": "변우석", "type": "good", "title": "투명 피부 타입"},
    # 폭탄 멤버 (5명)
    {"id": "hwang_jm", "name": "황정민", "type": "bomb", "title": "야생 피부 타입"},
    {"id": "jung_jc", "name": "정종철", "type": "bomb", "title": "스트레스 피부 타입"},
    {"id": "park_ms", "name": "박명수", "type": "bomb", "title": "술톤 피부 타입"},
    {"id": "yoo_hj", "name": "유해진", "type": "bomb", "title": "태닝 피부 타입"},
    {"id": "kim_jk", "name": "김종국", "type": "bomb", "title": "거친 피부 타입"},
]

GOOD_CELEBS = [c for c in CELEB_RESULTS if c["type"] == "good"]
BOMB_CELEBS = [c for c in CELEB_RESULTS if c["type"] == "bomb"]

# 확률: good 80%, bomb 20%
GOOD_PROBABILITY = 0.80
