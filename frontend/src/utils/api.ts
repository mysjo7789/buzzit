import { PostsResponse, PostDetailResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

let cachedData: PostsResponse | null = null
let lastFetchTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5분

async function loadData(): Promise<PostsResponse> {
  const now = Date.now()
  if (cachedData && (now - lastFetchTime) < CACHE_TTL) {
    return cachedData
  }
  const res = await fetch(`${API_BASE}/api/posts`)
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
    const res = await fetch(`${API_BASE}/api/posts?site=${siteCode}`)
    if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`)
    return await res.json() as PostsResponse
  },

  async getPostDetail(url: string): Promise<PostDetailResponse> {
    const res = await fetch(`${API_BASE}/api/post/detail?url=${encodeURIComponent(url)}`)
    if (!res.ok) throw new Error('Post not found')
    return await res.json() as PostDetailResponse
  },
}
