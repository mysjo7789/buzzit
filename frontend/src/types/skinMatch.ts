export type SkinMatchType = 'good' | 'bomb'

export interface SkinMatchCeleb {
  id: string
  name: string
  nameEn: string
  type: SkinMatchType
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  emoji: string
  imagePath: string
}

export interface SkinMatchApiResponse {
  result_id: string
  name: string
  title: string
  type: SkinMatchType
  share_text: string
}

export interface SkinMatchError {
  error: 'no_face' | 'too_dark' | 'too_blurry' | 'invalid_format' | 'server_error'
  message: string
}
