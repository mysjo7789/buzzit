import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { getResultByType } from '../data/results'
import { clearProgress, saveResult } from '../utils/mbtiStorage'
import { recordResult, getTotalTests, getMostCommonType, getTypeStats } from '../utils/mbtiStats'
import { MBTIResult } from '../types/mbti'
import { Post } from '../types'
import { apiService } from '../utils/api'
import ResultCard from '../components/mbti/ResultCard'
import ShareButtons from '../components/mbti/ShareButtons'
import PostCard from '../components/PostCard'

function MBTIResultPage() {
  const navigate = useNavigate()
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
      // type 파라미터가 없으면 시작 페이지로
      navigate('/mbti')
      return
    }

    const mbtiResult = getResultByType(type)
    if (!mbtiResult) {
      // 잘못된 type이면 시작 페이지로
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
    document.title = `나는 ${mbtiResult.title} ${mbtiResult.type}! | Buzzit MBTI`

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
        setPosts(data.posts.slice(0, 5)) // 상위 5개만
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoadingPosts(false)
      }
    }
    loadPosts()
  }, [type, navigate])

  const handleRestart = () => {
    // 진행 상황 초기화
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
          <p className="text-gray-600">결과를 불러오는 중...</p>
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
              <span>📊</span>
              실시간 통계
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {/* 총 테스트 수 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">총 테스트</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalTests}명</div>
              </div>

              {/* 이 유형 비율 */}
              {stats.currentTypeStats && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">이 유형 비율</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.currentTypeStats.percentage.toFixed(1)}%
                  </div>
                </div>
              )}

              {/* 가장 많은 유형 */}
              {stats.mostCommon && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">가장 많은 유형</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.mostCommon.type}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-center text-gray-500">
              * 이 브라우저에서 테스트한 결과 기반
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
        {/* 다시 하기 */}
        <button
          onClick={handleRestart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          다시 하기
        </button>

        {/* 친구 테스트하기 */}
        <button
          onClick={handleShareWithFriend}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg py-4 px-8 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-2 border-gray-200"
        >
          친구도 테스트하기
        </button>
      </div>

      {/* 유머 게시글 섹션 */}
      {!loadingPosts && posts.length > 0 && (
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">🔥 인기 게시글</h2>
              <p className="text-sm text-gray-500 mt-1">웃긴 유머도 함께 즐겨보세요!</p>
            </div>

            {/* 게시글 목록 */}
            <div>
              {posts.map((post, index) => (
                <PostCard key={`${post.site}-${post.url}`} post={post} rank={index + 1} />
              ))}
            </div>

            {/* 더보기 버튼 */}
            <div className="px-6 py-4 bg-gray-50 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                더 많은 게시글 보러가기
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

      {/* 하단 여백 */}
      <div className="h-8" />
    </div>
  )
}

export default MBTIResultPage
