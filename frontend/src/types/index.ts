export interface Post {
  site: string
  title: string
  url: string
  author?: string | null
  timestamp?: string | null
  views?: number | null
  likes?: number | null
  comments?: number | null
  collected_at: string
  thumbnail?: string | null
}

export interface PostsResponse {
  posts: Post[]
  metadata: {
    total_posts: number
    collected_at: string
    sites?: string[]
    site?: string
  }
}

export interface PostDetailResponse {
  post: Post
  buzzit_comments: number
}
