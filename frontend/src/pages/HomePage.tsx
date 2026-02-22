import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { apiService } from '../utils/api'
import { Post } from '../types'
import PostCard from '../components/PostCard'

type SortType = 'latest' | 'popular' | 'likes' | 'comments'

const SITE_LABELS: Record<string, string> = {
  humoruniv: '웃대',
  fmkorea: '에펨',
  ruliweb: '루리웹',
  etoland: '이토',
  inven: '인벤',
  mlbpark: 'MLB',
  damoang: '다모앙',
  ddanzi: '딴지',
  dcinside: '디시',
  clien: '클리앙',
  ppomppu: '뽐뿌',
  dogdrip: '개드립',
  theqoo: '더쿠',
  bobaedream: '보배',
  slrclub: 'SLR',
  '82cook': '82쿡',
}

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'likes', label: '추천순' },
  { key: 'comments', label: '댓글순' },
]

// 사이트별 라운드로빈 인터리빙: 전체 보기에서 특정 사이트가 연속으로 몰리지 않도록 섞음
const interleaveBySite = (posts: Post[]): Post[] => {
  const groups: Record<string, Post[]> = {}
  posts.forEach(p => {
    if (!groups[p.site]) groups[p.site] = []
    groups[p.site].push(p)
  })
  const siteKeys = Object.keys(groups)
  if (siteKeys.length <= 1) return posts

  const result: Post[] = []
  let round = 0
  while (result.length < posts.length) {
    for (const site of siteKeys) {
      if (round < groups[site].length) {
        result.push(groups[site][round])
      }
    }
    round++
  }
  return result
}

// 인기도 점수 계산: 사이트별 min-max 정규화 후 가중합
// 같은 커뮤니티 내에서 정규화하여 사이트 간 스케일 차이를 보정
const calcPerSitePopularityScores = (posts: Post[]): Map<Post, number> => {
  const groups: Record<string, Post[]> = {}
  posts.forEach(p => {
    if (!groups[p.site]) groups[p.site] = []
    groups[p.site].push(p)
  })

  const scores = new Map<Post, number>()

  for (const sitePosts of Object.values(groups)) {
    const views = sitePosts.map(p => p.views || 0)
    const likes = sitePosts.map(p => p.likes || 0)
    const comments = sitePosts.map(p => p.comments || 0)

    const minV = Math.min(...views), maxV = Math.max(...views)
    const minL = Math.min(...likes), maxL = Math.max(...likes)
    const minC = Math.min(...comments), maxC = Math.max(...comments)

    const rangeV = maxV - minV || 1
    const rangeL = maxL - minL || 1
    const rangeC = maxC - minC || 1

    for (const p of sitePosts) {
      const normV = ((p.views || 0) - minV) / rangeV
      const normL = ((p.likes || 0) - minL) / rangeL
      const normC = ((p.comments || 0) - minC) / rangeC
      // 조회(30%) + 추천(50%) + 댓글(20%)
      scores.set(p, normV * 0.3 + normL * 0.5 + normC * 0.2)
    }
  }

  return scores
}

const ITEMS_PER_PAGE = 30

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [collectedAt, setCollectedAt] = useState('')

  const activeSite = searchParams.get('site') || 'all'
  const activeSort = (searchParams.get('sort') as SortType) || 'latest'
  const currentPage = Number(searchParams.get('page')) || 1

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await apiService.getPosts()
      setAllPosts(data.posts)
      setCollectedAt(data.metadata.collected_at)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 사이트 목록 (데이터에서 동적으로 추출)
  const availableSites = useMemo(() => {
    const siteCounts: Record<string, number> = {}
    allPosts.forEach(p => {
      siteCounts[p.site] = (siteCounts[p.site] || 0) + 1
    })
    return Object.entries(siteCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, count }))
  }, [allPosts])

  // 필터링 + 정렬된 게시글
  const filteredPosts = useMemo(() => {
    let posts = [...allPosts]

    // 사이트 필터
    if (activeSite !== 'all') {
      posts = posts.filter(p => p.site === activeSite)
    }

    // 정렬
    switch (activeSort) {
      case 'popular': {
        const scores = calcPerSitePopularityScores(posts)
        posts.sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0))
        break
      }
      case 'likes':
        posts.sort((a, b) => (b.likes || 0) - (a.likes || 0))
        break
      case 'comments':
        posts.sort((a, b) => (b.comments || 0) - (a.comments || 0))
        break
      default:
        // latest - collected_at 기준
        posts.sort((a, b) => (b.collected_at || '').localeCompare(a.collected_at || ''))
    }

    // "전체" 보기 + 최신순: 사이트별 라운드로빈 인터리빙으로 결과 혼합
    if (activeSite === 'all' && activeSort === 'latest') {
      posts = interleaveBySite(posts)
    }

    return posts
  }, [allPosts, activeSite, activeSort])

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE)
  const visiblePosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(updates)) {
      if ((k === 'site' && v === 'all') || (k === 'sort' && v === 'latest') || (k === 'page' && v === '1')) {
        params.delete(k)
      } else {
        params.set(k, v)
      }
    }
    params.delete('page') // 필터/정렬 변경 시 항상 1페이지로
    setSearchParams(params, { replace: true })
  }

  const handleSiteChange = (site: string) => {
    updateParams({ site })
  }

  const handleSortChange = (sort: SortType) => {
    updateParams({ sort })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">인기글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 상단 정보 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h1 className="text-base font-bold text-gray-900">
            인기글
          </h1>
          <span className="text-xs text-gray-400">
            {allPosts.length}개
          </span>
        </div>
        <div className="flex items-center gap-2">
          {collectedAt && (
            <span className="text-xs text-gray-400">
              {new Date(collectedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 업데이트
            </span>
          )}
        </div>
      </div>

      {/* 커뮤니티 필터 */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => handleSiteChange('all')}
          className={`filter-chip ${activeSite === 'all' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
        >
          전체
        </button>
        {availableSites.map(({ code, count }) => (
          <button
            key={code}
            onClick={() => handleSiteChange(code)}
            className={`filter-chip ${activeSite === code ? 'filter-chip-active' : 'filter-chip-inactive'}`}
          >
            {SITE_LABELS[code] || code}
            <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* 정렬 옵션 */}
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
          {filteredPosts.length}개
        </span>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {visiblePosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">게시글이 없습니다</p>
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
            onClick={() => {
              const p = Math.max(1, currentPage - 1)
              const params = new URLSearchParams(searchParams)
              if (p <= 1) params.delete('page'); else params.set('page', String(p))
              setSearchParams(params, { replace: true })
            }}
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
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    if (item <= 1) params.delete('page'); else params.set('page', String(item))
                    setSearchParams(params, { replace: true })
                  }}
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
            onClick={() => {
              const p = Math.min(totalPages, currentPage + 1)
              const params = new URLSearchParams(searchParams)
              if (p <= 1) params.delete('page'); else params.set('page', String(p))
              setSearchParams(params, { replace: true })
            }}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage
