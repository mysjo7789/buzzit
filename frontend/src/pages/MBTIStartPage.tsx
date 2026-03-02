import { useNavigate } from 'react-router-dom'
import { hasProgress } from '../utils/mbtiStorage'

function MBTIStartPage() {
  const navigate = useNavigate()

  const handleStart = () => {
    // 진행 중인 테스트가 있는지 확인
    const hasSavedProgress = hasProgress()

    if (hasSavedProgress) {
      // 이어서 하기 확인
      const resume = window.confirm('진행 중인 테스트가 있습니다. 이어서 하시겠어요?')
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
          <h1 className="text-4xl font-bold text-gray-900 mb-3">🧠 MBTI 테스트</h1>
          <p className="text-xl text-gray-600">당신의 진짜 성격을 찾아보세요</p>
        </div>

        {/* 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-6 text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="font-medium">16개 질문</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <span className="font-medium">2-3분</span>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          시작하기 →
        </button>

        {/* 안내 문구 */}
        <p className="mt-6 text-sm text-gray-500">💡 편하게 직관적으로 선택하세요</p>

        {/* 면책 조항 */}
        <p className="mt-8 text-xs text-gray-400">
          이 테스트는 재미와 자기이해를 위한 것으로, 공식 MBTI®와 무관합니다.
        </p>
      </div>
    </div>
  )
}

export default MBTIStartPage
