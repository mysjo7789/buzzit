import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiService } from '../utils/api'
import { Post } from '../types'
import PostCard from '../components/PostCard'

type SortType = 'latest' | 'popular' | 'likes' | 'comments'

const siteNames: Record<string, string> = {
  humoruniv: '웃긴대학',
  ruliweb: '루리웹',
  etoland: '이토랜드',
  inven: '인벤',
  mlbpark: 'MLB파크',
  damoang: '다모앙',
  ddanzi: '딴지일보',
  clien: '클리앙',
  bobaedream: '보배드림',
  ppomppu: '뽐뿌',
  fmkorea: '에펨코리아',
  dcinside: '디시인사이드',
  dogdrip: '개드립',
  theqoo: '더쿠',
  '82cook': '82쿡',
}

const siteUrls: Record<string, string> = {
  humoruniv: 'https://web.humoruniv.com/',
  ruliweb: 'https://bbs.ruliweb.com/',
  etoland: 'https://www.etoland.co.kr/',
  inven: 'https://www.inven.co.kr/',
  mlbpark: 'https://mlbpark.donga.com/',
  damoang: 'https://damoang.net/',
  ddanzi: 'https://www.ddanzi.com/',
  clien: 'https://www.clien.net/',
  bobaedream: 'https://www.bobaedream.co.kr/',
  ppomppu: 'https://www.ppomppu.co.kr/',
}

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'likes', label: '추천순' },
  { key: 'comments', label: '댓글순' },
]

const ITEMS_PER_PAGE = 30

// 인기도 점수: 단일 사이트이므로 전체 포스트 대상 min-max 정규화
const calcPopularityScores = (posts: Post[]): Map<Post, number> => {
  const views = posts.map(p => p.views || 0)
  const likes = posts.map(p => p.likes || 0)
  const comments = posts.map(p => p.comments || 0)

  const minV = Math.min(...views), maxV = Math.max(...views)
  const minL = Math.min(...likes), maxL = Math.max(...likes)
  const minC = Math.min(...comments), maxC = Math.max(...comments)

  const rangeV = maxV - minV || 1
  const rangeL = maxL - minL || 1
  const rangeC = maxC - minC || 1

  const scores = new Map<Post, number>()
  for (const p of posts) {
    const normV = ((p.views || 0) - minV) / rangeV
    const normL = ((p.likes || 0) - minL) / rangeL
    const normC = ((p.comments || 0) - minC) / rangeC
    scores.set(p, normV * 0.3 + normL * 0.5 + normC * 0.2)
  }
  return scores
}

const SitePage = () => {
  const { siteCode } = useParams<{ siteCode: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSort, setActiveSort] = useState<SortType>('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const [collectedAt, setCollectedAt] = useState('')

  const fetchData = async () => {
    if (!siteCode) return
    try {
      setLoading(true)
      const data = await apiService.getPostsBySite(siteCode)
      setPosts(data.posts)
      setCollectedAt(data.metadata.collected_at)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [siteCode])

  const sortedPosts = useMemo(() => {
    const sorted = [...posts]
    switch (activeSort) {
      case 'popular': {
        const scores = calcPopularityScores(sorted)
        sorted.sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0))
        break
      }
      case 'likes':
        sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0))
        break
      case 'comments':
        sorted.sort((a, b) => (b.comments || 0) - (a.comments || 0))
        break
      default:
        sorted.sort((a, b) => (b.collected_at || '').localeCompare(a.collected_at || ''))
    }
    return sorted
  }, [posts, activeSort])

  const totalPages = Math.ceil(sortedPosts.length / ITEMS_PER_PAGE)
  const visiblePosts = sortedPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSortChange = (sort: SortType) => {
    setActiveSort(sort)
    setCurrentPage(1)
  }

  const siteName = siteNames[siteCode || ''] || siteCode || ''
  const siteUrl = siteUrls[siteCode || ''] || ''

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{siteName}</h1>
            <p className="text-xs text-gray-400">{posts.length}개의 인기글</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 px-2 py-1 rounded-md hover:bg-gray-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">원본</span>
            </a>
          )}
        </div>
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-2">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSortChange(key)}
            className={`sort-tab ${activeSort === key ? 'sort-tab-active' : 'sort-tab-inactive'}`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {sortedPosts.length}개
        </span>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {visiblePosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">수집된 게시글이 없습니다</p>
          </div>
        ) : (
          visiblePosts.map((post, index) => (
            <PostCard
              key={`${post.site}-${post.url}-${index}`}
              post={post}
              rank={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
            />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              if (totalPages <= 7) return true
              if (page === 1 || page === totalPages) return true
              return Math.abs(page - currentPage) <= 1
            })
            .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
              if (idx > 0 && page - (arr[idx - 1]) > 1) acc.push('ellipsis')
              acc.push(page)
              return acc
            }, [])
            .map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`e-${idx}`} className="px-1 text-xs text-gray-300">...</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`min-w-[28px] h-7 text-xs rounded-md transition-colors ${
                    currentPage === item
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-primary-600'
                  }`}
                >
                  {item}
                </button>
              )
            )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 업데이트 정보 */}
      {collectedAt && (
        <p className="text-center text-xs text-gray-400">
          마지막 업데이트: {new Date(collectedAt).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  )
}

export default SitePage
