import { PostsResponse, PostDetailResponse } from '../types'

const DATA_URL = import.meta.env.VITE_DATA_URL
  || 'https://mysjo7789.github.io/buzzit/buzzit_posts.json'

let cachedData: PostsResponse | null = null
let lastFetchTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5분

async function loadData(): Promise<PostsResponse> {
  const now = Date.now()
  if (cachedData && (now - lastFetchTime) < CACHE_TTL) {
    return cachedData
  }
  const res = await fetch(DATA_URL)
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`)
  cachedData = await res.json() as PostsResponse
  lastFetchTime = now
  return cachedData
}

export const apiService = {
  async getPosts(): Promise<PostsResponse> {
    return loadData()
  },

  async getPostsBySite(siteCode: string): Promise<PostsResponse> {
    const data = await loadData()
    const filtered = data.posts.filter(p => p.site === siteCode)
    return {
      posts: filtered,
      metadata: {
        total_posts: filtered.length,
        collected_at: data.metadata.collected_at,
        site: siteCode,
      },
    }
  },

  async getPostDetail(url: string): Promise<PostDetailResponse> {
    const data = await loadData()
    const post = data.posts.find(p => p.url === url)
    if (!post) throw new Error('Post not found')
    return {
      post,
      buzzit_comments: 0,
    }
  },
}
