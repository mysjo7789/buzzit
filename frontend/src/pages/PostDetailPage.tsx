import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2, Eye, Heart, MessageCircle } from 'lucide-react'
import { decodePostId } from '../utils/postUrl'
import { apiService } from '../utils/api'
import { Post } from '../types'

const siteNames: Record<string, string> = {
  humoruniv: '웃긴대학',
  fmkorea: '에펨코리아',
  ruliweb: '루리웹',
  etoland: '이토랜드',
  inven: '인벤',
  mlbpark: 'MLB파크',
  damoang: '다모앙',
  ddanzi: '딴지일보',
  dcinside: '디시인사이드',
  clien: '클리앙',
  ppomppu: '뽐뿌',
  bobaedream: '보배드림',
  slrclub: 'SLR클럽',
  dogdrip: '개드립',
  theqoo: '더쿠',
  '82cook': '82쿡',
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

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return null
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}천`
  return num.toString()
}

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  const postUrl = postId ? decodePostId(postId) : ''

  useEffect(() => {
    if (!postUrl) return
    const load = async () => {
      setLoading(true)
      try {
        const detailRes = await apiService.getPostDetail(postUrl)
        setPost(detailRes.post)
      } catch (err) {
        console.error('Failed to load post detail:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [postUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-gray-500">게시글을 찾을 수 없습니다</p>
        <Link to="/" className="text-sm text-primary-600 hover:underline">홈으로 돌아가기</Link>
      </div>
    )
  }

  useEffect(() => {
    if (post) {
      const name = siteNames[post.site] || post.site
      document.title = `${post.title} - ${name} | Buzzit`
    }
    return () => { document.title = 'Buzzit - 커뮤니티 인기글 모아보기' }
  }, [post])

  const siteName = siteNames[post.site] || post.site
  const badgeClass = siteStyles[post.site] || 'bg-gray-100 text-gray-700'
  const formattedViews = formatNumber(post.views)
  const formattedLikes = formatNumber(post.likes)
  const formattedComments = formatNumber(post.comments)

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-start gap-3">
        <Link to="/" className="mt-1 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
              {siteName}
            </span>
            {post.author && (
              <span className="text-xs text-gray-400">{post.author}</span>
            )}
          </div>
          <h1 className="text-lg font-bold text-gray-900 leading-snug">{post.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
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
          </div>
        </div>
      </div>

      {/* 원본 링크 */}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        원본 게시글 보기
      </a>

    </div>
  )
}

export default PostDetailPage
