interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

const DATA_URL = 'https://mysjo7789.github.io/buzzit/buzzit_posts.json'
const SITE_URL = 'https://bzibzi.com'

const SITE_NAMES: Record<string, string> = {
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
  dogdrip: '개드립',
  theqoo: '더쿠',
  bobaedream: '보배드림',
  slrclub: 'SLR클럽',
  '82cook': '82쿡',
}

interface Post {
  site: string
  title: string
  url: string
  thumbnail?: string | null
}

interface PostsData {
  posts: Post[]
  metadata: { total_posts: number; collected_at: string; sites?: string[] }
}

// 모듈 레벨 캐시 (같은 isolate 내 요청 간 공유)
let cachedData: PostsData | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

async function loadData(): Promise<PostsData | null> {
  const now = Date.now()
  if (cachedData && now - cacheTime < CACHE_TTL) return cachedData
  try {
    const res = await fetch(DATA_URL)
    if (!res.ok) return cachedData
    const data = (await res.json()) as PostsData
    cachedData = data
    cacheTime = now
    return data
  } catch {
    return cachedData
  }
}

function decodePostId(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  return decodeURIComponent(atob(base64))
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface Meta {
  title: string
  description: string
  canonical: string
  ogType: string
  ogImage: string
  twitterCard: string
  jsonLd: string
}

async function getMeta(pathname: string): Promise<Meta> {
  const m: Meta = {
    title: 'Buzzit - 커뮤니티 인기글 모아보기',
    description:
      '웃긴대학, 에펨코리아, 루리웹, 클리앙, 뽐뿌, 보배드림, 디시인사이드 등 국내 주요 커뮤니티 인기글을 한곳에서 모아보세요.',
    canonical: SITE_URL + (pathname === '/' ? '' : pathname),
    ogType: 'website',
    ogImage: `${SITE_URL}/og-default.png`,
    twitterCard: 'summary',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Buzzit',
      url: SITE_URL,
      description:
        '국내 주요 커뮤니티 인기글을 한곳에서 모아보는 큐레이션 서비스',
    }),
  }

  const postMatch = pathname.match(/^\/post\/([^/?#]+)/)
  const siteMatch = pathname.match(/^\/site\/([^/?#]+)/)

  if (postMatch) {
    try {
      const data = await loadData()
      if (data) {
        const postUrl = decodePostId(decodeURIComponent(postMatch[1]))
        const post = data.posts.find((p) => p.url === postUrl)
        if (post) {
          const siteName = SITE_NAMES[post.site] || post.site
          m.title = `${post.title} - ${siteName} | Buzzit`
          m.description = `${siteName} 인기글: ${post.title}`
          m.ogType = 'article'
          if (post.thumbnail) {
            m.ogImage = post.thumbnail
            m.twitterCard = 'summary_large_image'
          }
          m.jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            url: m.canonical,
            publisher: { '@type': 'Organization', name: 'Buzzit' },
          })
        }
      }
    } catch {
      // fallback to defaults
    }
  } else if (siteMatch) {
    const code = siteMatch[1]
    const name = SITE_NAMES[code] || code
    m.title = `${name} 인기글 - Buzzit`
    m.description = `${name}의 인기 게시글을 실시간으로 모아보세요. 추천, 조회수, 댓글 기반 인기글 랭킹.`
    m.jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${name} 인기글`,
      url: m.canonical,
      description: m.description,
    })
  } else if (pathname === '/about') {
    m.title = 'Buzzit 소개'
    m.description =
      'Buzzit은 국내 주요 커뮤니티의 인기글을 한곳에서 모아보는 큐레이션 서비스입니다.'
  } else if (pathname === '/privacy') {
    m.title = '개인정보처리방침 - Buzzit'
    m.description = 'Buzzit 개인정보처리방침'
  } else if (pathname === '/terms') {
    m.title = '이용약관 - Buzzit'
    m.description = 'Buzzit 서비스 이용약관'
  }

  return m
}

function buildSeoBlock(m: Meta): string {
  return `<!--seo-start-->
    <title>${esc(m.title)}</title>
    <meta name="description" content="${esc(m.description)}" />
    <link rel="canonical" href="${esc(m.canonical)}" />
    <meta property="og:type" content="${m.ogType}" />
    <meta property="og:title" content="${esc(m.title)}" />
    <meta property="og:description" content="${esc(m.description)}" />
    <meta property="og:url" content="${esc(m.canonical)}" />
    <meta property="og:site_name" content="Buzzit" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:image" content="${esc(m.ogImage)}" />
    <meta name="twitter:card" content="${m.twitterCard}" />
    <meta name="twitter:title" content="${esc(m.title)}" />
    <meta name="twitter:description" content="${esc(m.description)}" />
    <meta name="twitter:image" content="${esc(m.ogImage)}" />
    <script type="application/ld+json">${m.jsonLd}</script>
    <!--seo-end-->`
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)

  // 정적 에셋 먼저 시도
  const response = await context.next()

  if (response.ok) {
    const ct = response.headers.get('content-type') || ''
    // JS, CSS, 이미지 등 정적 에셋은 그대로 반환
    if (!ct.includes('text/html')) return response
  } else {
    // 파일 확장자가 있는 404는 그대로 반환
    if (/\.\w{1,10}$/.test(url.pathname)) return response
  }

  // SPA 라우트: index.html 서빙 (기존 _redirects 대체)
  const indexResponse = response.ok
    ? response
    : await context.env.ASSETS.fetch(
        new Request(new URL('/index.html', url.origin))
      )

  // 라우트별 메타 태그 생성 & HTML 교체
  const meta = await getMeta(url.pathname)
  let html = await indexResponse.text()

  html = html.replace(
    /<!--seo-start-->[\s\S]*?<!--seo-end-->/,
    buildSeoBlock(meta)
  )

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html;charset=UTF-8' },
  })
}
