import { useState, useEffect } from 'react'
import { translateText } from '../utils/translate'
import { useTranslation } from './useTranslation'
import type { Post } from '../types'

/**
 * 게시글 제목 번역 Hook
 * @param post 게시글
 * @returns 번역된 제목 (번역 중이면 원본 제목)
 */
export function usePostTranslation(post: Post): string {
  const { locale } = useTranslation()
  const [translatedTitle, setTranslatedTitle] = useState<string>(post.title)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    // 한국어면 번역 불필요
    if (locale === 'ko') {
      setTranslatedTitle(post.title)
      return
    }

    // 이미 번역 중이면 스킵
    if (isTranslating) return

    // 번역 시작
    setIsTranslating(true)

    translateText(post.title, locale, 'ko')
      .then((translated) => {
        setTranslatedTitle(translated)
      })
      .catch((error) => {
        console.error('Translation error:', error)
        setTranslatedTitle(post.title) // 에러 시 원본 제목 사용
      })
      .finally(() => {
        setIsTranslating(false)
      })
  }, [post.title, locale])

  return translatedTitle
}
