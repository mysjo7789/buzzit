import { SkinMatchApiResponse, SkinMatchError } from '../types/skinMatch'
import { resizeAndCompress } from './imageProcessor'

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api`
const TIMEOUT_MS = 15000

export async function analyzeSkin(file: File): Promise<SkinMatchApiResponse> {
  const compressed = await resizeAndCompress(file)

  const formData = new FormData()
  formData.append('image', compressed, 'photo.jpg')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${API_BASE}/skin-match`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    if (!res.ok) {
      const errorData: SkinMatchError = await res.json().catch(() => ({
        error: 'server_error' as const,
        message: '서버 오류가 발생했습니다',
      }))
      throw errorData
    }

    return await res.json()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw { error: 'server_error', message: '요청 시간이 초과되었습니다' } as SkinMatchError
    }
    if ((err as SkinMatchError).error) {
      throw err
    }
    throw { error: 'server_error', message: '네트워크 오류가 발생했습니다' } as SkinMatchError
  } finally {
    clearTimeout(timer)
  }
}
