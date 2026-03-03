import { MBTIResult } from '../../types/mbti'
import { useTranslation } from '../../hooks/useTranslation'
import { isKakaoAvailable, getKakao } from '../../utils/kakao'

interface ShareButtonsProps {
  result: MBTIResult
}

function ShareButtons({ result }: ShareButtonsProps) {
  const { t } = useTranslation()
  const { type } = result
  const typeKey = type.toUpperCase()
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://bzibzi.com'
  const currentUrl = `${siteUrl}/mbti/result?type=${type}`
  const startUrl = `${siteUrl}/mbti`

  const title = t(`mbti.types.${typeKey}.title`)
  const subtitle = t(`mbti.types.${typeKey}.subtitle`)

  const handleKakaoShare = () => {
    if (!isKakaoAvailable()) {
      alert(t('mbti.result.share.kakaoUnavailable'))
      return
    }

    try {
      const Kakao = getKakao()
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: t('mbti.result.share.shareTitle', { title, type }),
          description: t('mbti.result.share.shareDesc', { subtitle }),
          imageUrl: `${siteUrl}/og-mbti-${type.toLowerCase()}.png`,
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
          },
        },
        buttons: [
          {
            title: t('mbti.result.share.kakaoButton'),
            link: {
              mobileWebUrl: startUrl,
              webUrl: startUrl,
            },
          },
        ],
      })
    } catch (error) {
      console.error('Kakao share error:', error)
      alert(t('mbti.result.share.kakaoError'))
    }
  }

  const handleTwitterShare = () => {
    const text = t('mbti.result.share.tweetText', { subtitle, type })
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      alert(t('mbti.result.share.linkCopied'))
    } catch (error) {
      console.error('Copy error:', error)
      const textarea = document.createElement('textarea')
      textarea.value = currentUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert(t('mbti.result.share.linkCopied'))
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">{t('mbti.result.share.title')}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={handleKakaoShare}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-yellow-400 hover:bg-yellow-500 transition-colors"
          title={t('mbti.result.share.kakao')}
        >
          <svg className="w-8 h-8 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.671 1.815 4.993 4.528 6.366-.215.803-.731 2.72-.848 3.155-.146.537.198.529.416.384.177-.118 2.871-1.992 3.333-2.313C10.266 18.036 11.133 18 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900">{t('mbti.result.share.kakao')}</span>
        </button>

        <button
          onClick={handleTwitterShare}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-400 hover:bg-blue-500 transition-colors"
          title={t('mbti.result.share.twitter')}
        >
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
          </svg>
          <span className="text-sm font-semibold text-white">{t('mbti.result.share.twitter')}</span>
        </button>

        <button
          onClick={handleFacebookShare}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
          title={t('mbti.result.share.facebook')}
        >
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="text-sm font-semibold text-white">{t('mbti.result.share.facebook')}</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
          title={t('mbti.result.share.copyLink')}
        >
          <svg
            className="w-8 h-8 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-700">{t('mbti.result.share.copyLink')}</span>
        </button>
      </div>
    </div>
  )
}

export default ShareButtons
