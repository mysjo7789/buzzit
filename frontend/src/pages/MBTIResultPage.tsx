import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { getResultByType } from '../data/results'
import { clearProgress, saveResult } from '../utils/mbtiStorage'
import { recordResult, getTotalTests, getMostCommonType, getTypeStats } from '../utils/mbtiStats'
import { MBTIResult } from '../types/mbti'
import { Post } from '../types'
import { apiService } from '../utils/api'
import { useTranslation } from '../hooks/useTranslation'
import ResultCard from '../components/mbti/ResultCard'
import ShareButtons from '../components/mbti/ShareButtons'
import PostCard from '../components/PostCard'

function MBTIResultPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')

  const [result, setResult] = useState<MBTIResult | null>(null)
  const [stats, setStats] = useState<{
    totalTests: number
    mostCommon: { type: string; percentage: number } | null
    currentTypeStats: { percentage: number; rank: number } | null
  }>({
    totalTests: 0,
    mostCommon: null,
    currentTypeStats: null,
  })
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    if (!type) {
      navigate('/mbti')
      return
    }

    const mbtiResult = getResultByType(type)
    if (!mbtiResult) {
      navigate('/mbti')
      return
    }

    setResult(mbtiResult)

    // 결과 저장
    saveResult(mbtiResult)

    // 통계 기록
    recordResult(type)

    // 통계 로드
    const totalTests = getTotalTests()
    const mostCommon = getMostCommonType()
    const currentTypeStats = getTypeStats(type)

    setStats({
      totalTests,
      mostCommon: mostCommon
        ? { type: mostCommon.type, percentage: mostCommon.percentage }
        : null,
      currentTypeStats: currentTypeStats
        ? { percentage: currentTypeStats.percentage, rank: currentTypeStats.rank }
        : null,
    })

    // 메타 태그 업데이트 (동적 OG 이미지)
    const typeTitle = t(`mbti.types.${type.toUpperCase()}.title`)
    document.title = t('mbti.result.pageTitle', { title: typeTitle, type: type.toUpperCase() })

    // OG 이미지 업데이트
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://bzibzi.com'
    const ogImage = document.querySelector('meta[property="og:image"]')
    if (ogImage) {
      ogImage.setAttribute('content', `${siteUrl}/og-mbti-${type.toLowerCase()}.png`)
    }

    // 유머 게시글 로드
    const loadPosts = async () => {
      setLoadingPosts(true)
      try {
        const data = await apiService.getPosts()
        setPosts(data.posts.slice(0, 5))
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoadingPosts(false)
      }
    }
    loadPosts()
  }, [type, navigate])

  const handleRestart = () => {
    clearProgress()
    navigate('/mbti')
  }

  const handleShareWithFriend = () => {
    navigate('/mbti')
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('mbti.result.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      {/* 결과 카드 */}
      <div className="animate-fadeIn">
        <ResultCard result={result} />
      </div>

      {/* 실시간 통계 */}
      {stats.totalTests > 0 && (
        <div className="mt-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center flex items-center justify-center gap-2">
              {t('mbti.result.stats.title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('mbti.result.stats.totalTests')}</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalTests}{t('mbti.result.stats.people')}</div>
              </div>

              {stats.currentTypeStats && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">{t('mbti.result.stats.typeRatio')}</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.currentTypeStats.percentage.toFixed(1)}%
                  </div>
                </div>
              )}

              {stats.mostCommon && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">{t('mbti.result.stats.mostCommon')}</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.mostCommon.type}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-center text-gray-500">
              {t('mbti.result.stats.disclaimer')}
            </p>
          </div>
        </div>
      )}

      {/* 공유 버튼 */}
      <div className="mt-6">
        <ShareButtons result={result} />
      </div>

      {/* 액션 버튼 */}
      <div className="max-w-2xl mx-auto mt-6 space-y-4">
        <button
          onClick={handleRestart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          {t('mbti.result.actions.restart')}
        </button>

        <button
          onClick={handleShareWithFriend}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg py-4 px-8 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-2 border-gray-200"
        >
          {t('mbti.result.actions.shareWithFriend')}
        </button>
      </div>

      {/* 피부 닮은꼴 테스트 유도 */}
      <div className="max-w-2xl mx-auto mt-8">
        <Link
          to="/tests/skin-match"
          className="block bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-md p-6 text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">📸</span>
            <div>
              <h3 className="text-lg font-bold">{t('skinMatch.banner.title')}</h3>
              <p className="text-white/80 text-sm mt-1">{t('skinMatch.banner.subtitle')}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 유머 게시글 섹션 */}
      {!loadingPosts && posts.length > 0 && (
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{t('mbti.result.posts.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('mbti.result.posts.subtitle')}</p>
            </div>

            <div>
              {posts.map((post, index) => (
                <PostCard key={`${post.site}-${post.url}`} post={post} rank={index + 1} />
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                {t('mbti.result.posts.viewMore')}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}

export default MBTIResultPage
