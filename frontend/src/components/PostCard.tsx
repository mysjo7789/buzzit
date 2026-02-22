import { useState } from 'react'
import { Eye, Heart, MessageCircle } from 'lucide-react'
import { Post } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PostCardProps {
  post: Post
  rank: number
}

const siteNames: Record<string, string> = {
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

const siteMarks: Record<string, string> = {
  humoruniv: '웃',
  fmkorea: 'FM',
  ruliweb: '루',
  etoland: '이',
  inven: '인',
  mlbpark: 'ML',
  damoang: '다',
  ddanzi: '딴',
  dcinside: 'DC',
  clien: '클',
  ppomppu: '뽐',
  dogdrip: '개',
  theqoo: '쿠',
  bobaedream: '보',
  slrclub: 'SL',
  '82cook': '82',
}

const siteStyles: Record<string, string> = {
  humoruniv: 'bg-orange-100 text-orange-700',
  fmkorea: 'bg-blue-100 text-blue-700',
  ruliweb: 'bg-sky-100 text-sky-700',
  etoland: 'bg-emerald-100 text-emerald-700',
  inven: 'bg-indigo-100 text-indigo-700',
  mlbpark: 'bg-red-100 text-red-700',
  damoang: 'bg-purple-100 text-purple-700',
  ddanzi: 'bg-pink-100 text-pink-700',
  dcinside: 'bg-slate-100 text-slate-700',
  clien: 'bg-teal-100 text-teal-700',
  ppomppu: 'bg-cyan-100 text-cyan-700',
  dogdrip: 'bg-lime-100 text-lime-700',
  theqoo: 'bg-rose-100 text-rose-700',
  bobaedream: 'bg-amber-100 text-amber-700',
  slrclub: 'bg-stone-100 text-stone-700',
  '82cook': 'bg-violet-100 text-violet-700',
}

const VISITED_KEY = 'buzzit_visited'
const getVisitedSet = (): Set<string> => {
  try {
    const raw = localStorage.getItem(VISITED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}
const markVisited = (url: string) => {
  const visited = getVisitedSet()
  visited.add(url)
  // 최근 500개만 유지
  const arr = [...visited]
  if (arr.length > 500) arr.splice(0, arr.length - 500)
  localStorage.setItem(VISITED_KEY, JSON.stringify(arr))
}

const PostCard = ({ post, rank }: PostCardProps) => {
  const [imgError, setImgError] = useState(false)
  const [visited, setVisited] = useState(() => getVisitedSet().has(post.url))

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return null
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천`
    return num.toString()
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: false, locale: ko })
    } catch {
      return ''
    }
  }

  const badgeClass = siteStyles[post.site] || 'bg-gray-100 text-gray-700'
  const siteName = siteNames[post.site] || post.site

  const thumbnailSrc = post.thumbnail

  const formattedViews = formatNumber(post.views)
  const formattedLikes = formatNumber(post.likes)
  const formattedComments = formatNumber(post.comments)

  return (
    <a
      href={post.url}
      rel="noopener noreferrer"
      onClick={() => { markVisited(post.url); setVisited(true) }}
      className={`flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors duration-100 border-b border-gray-100 group ${visited ? 'bg-gray-50/80' : 'bg-white'}`}
    >
      {/* 순위 */}
      <span className="text-sm font-semibold text-gray-400 w-5 text-right flex-shrink-0">
        {rank}
      </span>

      {/* 썸네일 */}
      {post.thumbnail && !imgError ? (
        <img
          src={thumbnailSrc || undefined}
          alt=""
          className="w-10 h-10 rounded object-cover flex-shrink-0"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth < 50 || img.naturalHeight < 50) {
              setImgError(true)
            }
          }}
        />
      ) : (
        <div className={`w-10 h-10 rounded flex-shrink-0 flex items-center justify-center ${badgeClass}`}>
          <span className="text-xs font-bold leading-none">{siteMarks[post.site] || post.site[0]}</span>
        </div>
      )}

      {/* 본문 영역 */}
      <div className="flex-1 min-w-0">
        {/* 제목 행 */}
        <div className="flex items-start gap-1.5">
          <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium flex-shrink-0 leading-none ${badgeClass}`}>
            {siteName}
          </span>
          <h3 className={`text-sm transition-colors line-clamp-1 leading-snug ${visited ? 'text-gray-400' : 'text-gray-900 group-hover:text-primary-600'}`}>
            {post.title}
          </h3>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center gap-2.5 mt-1 text-[11px] text-gray-400">
          {formattedViews && (
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {formattedViews}
            </span>
          )}
          {formattedLikes && (
            <span className="flex items-center gap-0.5 text-rose-400">
              <Heart className="h-3 w-3" />
              {formattedLikes}
            </span>
          )}
          {formattedComments && (
            <span className="flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" />
              {formattedComments}
            </span>
          )}
          <span className="ml-auto">
            {formatTime(post.collected_at)}
          </span>
        </div>
      </div>
    </a>
  )
}

export default PostCard
