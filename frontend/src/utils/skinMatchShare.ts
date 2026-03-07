import { SkinMatchCeleb } from '../types/skinMatch'
import { isKakaoAvailable, getKakao } from './kakao'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://bzibzi.com'

function getResultUrl(celebId: string): string {
  return `${SITE_URL}/tests/skin-match/result/${celebId}`
}

function getTestUrl(): string {
  return `${SITE_URL}/tests/skin-match`
}

export function shareKakao(celeb: SkinMatchCeleb): void {
  if (!isKakaoAvailable()) return

  const Kakao = getKakao()
  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `AI 피부 닮은꼴: ${celeb.name} 타입!`,
      description: celeb.description,
      imageUrl: `${SITE_URL}${celeb.imagePath}`,
      link: {
        mobileWebUrl: getResultUrl(celeb.id),
        webUrl: getResultUrl(celeb.id),
      },
    },
    buttons: [
      {
        title: '나도 테스트하기',
        link: {
          mobileWebUrl: getTestUrl(),
          webUrl: getTestUrl(),
        },
      },
    ],
  })
}

export function shareTwitter(celeb: SkinMatchCeleb): void {
  const text = `AI 피부 닮은꼴 테스트 결과: ${celeb.emoji} ${celeb.name} 타입 (${celeb.title})! 나도 해보기 👉`
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getTestUrl())}`
  window.open(url, '_blank', 'width=550,height=420')
}

export function shareFacebook(celeb: SkinMatchCeleb): void {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getResultUrl(celeb.id))}`
  window.open(url, '_blank', 'width=550,height=420')
}

export async function copyLink(celeb: SkinMatchCeleb): Promise<boolean> {
  const url = getResultUrl(celeb.id)
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = url
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}
