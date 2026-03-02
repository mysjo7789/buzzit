import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { questions } from '../data/questions'
import { MBTIAnswer, MBTIOption } from '../types/mbti'
import { saveProgress, loadProgress, clearProgress } from '../utils/mbtiStorage'
import { calculateMBTI } from '../utils/mbtiCalculator'
import QuestionCard from '../components/mbti/QuestionCard'
import ProgressBar from '../components/mbti/ProgressBar'

function MBTITestPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNewTest = searchParams.get('new') === 'true'

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<MBTIAnswer[]>([])

  // 페이지 로드 시 진행 상황 복원
  useEffect(() => {
    if (isNewTest) {
      // 새로 시작하는 경우
      clearProgress()
      setAnswers([])
      setCurrentQuestionIndex(0)
    } else {
      // 이전 진행 상황 복원
      const savedAnswers = loadProgress()
      if (savedAnswers && savedAnswers.length > 0) {
        setAnswers(savedAnswers)
        setCurrentQuestionIndex(savedAnswers.length)
      }
    }
  }, [isNewTest])

  // 답변 저장 시 자동으로 LocalStorage에 저장
  useEffect(() => {
    if (answers.length > 0) {
      saveProgress(answers)
    }
  }, [answers])

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  const handleSelect = (option: MBTIOption) => {
    const question = questions[currentQuestionIndex]
    const selectedOption = option === 'A' ? question.optionA : question.optionB

    const newAnswer: MBTIAnswer = {
      questionId: question.id,
      selected: option,
      score: selectedOption.score,
      dimension: question.dimension,
    }

    // 새 답변 추가 (또는 기존 답변 업데이트)
    const newAnswers = [...answers]
    if (newAnswers[currentQuestionIndex]) {
      // 이미 답변한 질문을 다시 선택하는 경우
      newAnswers[currentQuestionIndex] = newAnswer
    } else {
      // 새로운 답변
      newAnswers.push(newAnswer)
    }

    setAnswers(newAnswers)

    // 0.3초 딜레이 후 다음 질문으로 이동
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // 마지막 질문 완료 - 결과 계산
        handleComplete(newAnswers)
      }
    }, 300)
  }

  const handleComplete = (finalAnswers: MBTIAnswer[]) => {
    // MBTI 타입 계산
    const mbtiType = calculateMBTI(finalAnswers)

    // 진행 상황 초기화
    clearProgress()

    // 결과 페이지로 이동
    navigate(`/mbti/result?type=${mbtiType}`)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleExit = () => {
    const confirmExit = window.confirm('테스트를 종료하시겠어요? 진행 상황은 저장됩니다.')
    if (confirmExit) {
      navigate('/mbti')
    }
  }

  // 현재 질문의 이전 답변 가져오기
  const currentAnswer = answers[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* 상단 바 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* 나가기 버튼 */}
            <button
              onClick={handleExit}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="나가기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* MBTI 타이틀 */}
            <h1 className="text-lg font-bold text-gray-900">MBTI 테스트</h1>

            {/* 빈 공간 (균형 맞추기) */}
            <div className="w-6" />
          </div>

          {/* 진행도 바 */}
          <ProgressBar current={currentQuestionIndex + 1} total={totalQuestions} />
        </div>
      </div>

      {/* 질문 영역 */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="animate-fadeIn">
          <QuestionCard
            question={currentQuestion}
            onSelect={handleSelect}
            selectedOption={currentAnswer?.selected}
          />
        </div>

        {/* 이전 버튼 */}
        {currentQuestionIndex > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              이전 질문
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MBTITestPage
