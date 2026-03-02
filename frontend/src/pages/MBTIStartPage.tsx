import { useNavigate } from 'react-router-dom'
import { hasProgress } from '../utils/mbtiStorage'
import { useTranslation } from '../hooks/useTranslation'

function MBTIStartPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleStart = () => {
    // 진행 중인 테스트가 있는지 확인
    const hasSavedProgress = hasProgress()

    if (hasSavedProgress) {
      // 이어서 하기 확인
      const resume = window.confirm(t('mbti.test.resume'))
      if (resume) {
        navigate('/mbti/test')
      } else {
        // 새로 시작
        navigate('/mbti/test?new=true')
      }
    } else {
      navigate('/mbti/test')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-md w-full text-center">
        {/* 제목 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">🧠 {t('mbti.start.title')}</h1>
          <p className="text-xl text-gray-600">{t('mbti.start.subtitle')}</p>
        </div>

        {/* 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-6 text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="font-medium">{t('mbti.start.questions')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <span className="font-medium">{t('mbti.start.duration')}</span>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          {t('mbti.start.startButton')}
        </button>

        {/* 안내 문구 */}
        <p className="mt-6 text-sm text-gray-500">{t('mbti.start.tip')}</p>

        {/* 면책 조항 */}
        <p className="mt-8 text-xs text-gray-400">
          {t('mbti.start.disclaimer')}
        </p>
      </div>
    </div>
  )
}

export default MBTIStartPage
