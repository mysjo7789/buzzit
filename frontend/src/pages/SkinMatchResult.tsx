import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getCelebById } from '../data/skinMatchResults'
import { SkinMatchCeleb } from '../types/skinMatch'
import { useTranslation } from '../hooks/useTranslation'
import SkinMatchResultCard from '../components/skinMatch/SkinMatchResultCard'
import SkinMatchShareButtons from '../components/skinMatch/SkinMatchShareButtons'

function SkinMatchResult() {
  const navigate = useNavigate()
  const { t, locale } = useTranslation()
  const { resultId } = useParams<{ resultId: string }>()
  const [celeb, setCeleb] = useState<SkinMatchCeleb | null>(null)

  useEffect(() => {
    if (!resultId) {
      navigate('/tests/skin-match')
      return
    }

    const found = getCelebById(resultId)
    if (!found) {
      navigate('/tests/skin-match')
      return
    }

    setCeleb(found)

    // Update document title
    const name = locale === 'ko' ? found.name : found.nameEn
    const title = locale === 'ko' ? found.title : found.titleEn
    document.title = `${found.emoji} ${name} - ${title} | Buzzit`

    // Update OG meta
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://bzibzi.com'
    const ogImage = document.querySelector('meta[property="og:image"]')
    if (ogImage) {
      ogImage.setAttribute('content', `${siteUrl}${found.imagePath}`)
    }
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', `AI 피부 닮은꼴: ${name} 타입!`)
    }
  }, [resultId, navigate, locale])

  if (!celeb) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      {/* 결과 카드 */}
      <div className="animate-fadeIn">
        <SkinMatchResultCard celeb={celeb} />
      </div>

      {/* 공유 버튼 */}
      <div className="mt-6">
        <SkinMatchShareButtons celeb={celeb} />
      </div>

      {/* 액션 버튼 */}
      <div className="max-w-md mx-auto mt-6 space-y-3">
        <button
          onClick={() => navigate('/tests/skin-match')}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          {t('skinMatch.result.retry')}
        </button>

        <Link
          to="/tests/skin-match"
          className="block w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg py-4 px-8 rounded-xl shadow-md border-2 border-gray-200 text-center transition-all"
        >
          {t('skinMatch.result.friendTest')}
        </Link>
      </div>

      {/* MBTI 테스트 유도 */}
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-3">{t('skinMatch.result.otherTests')}</p>
          <Link
            to="/mbti"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
          >
            🧠 {t('skinMatch.result.mbtiLink')}
          </Link>
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}

export default SkinMatchResult
