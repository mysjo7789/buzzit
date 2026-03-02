import { MBTIQuestion, MBTIOption } from '../../types/mbti'

interface QuestionCardProps {
  question: MBTIQuestion
  onSelect: (option: MBTIOption) => void
  selectedOption?: MBTIOption
}

function QuestionCard({ question, onSelect, selectedOption }: QuestionCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 질문 텍스트 */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {question.text}
        </h2>
      </div>

      {/* 선택지 */}
      <div className="space-y-4">
        {/* 옵션 A */}
        <button
          onClick={() => onSelect('A')}
          className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
            selectedOption === 'A'
              ? 'border-orange-500 bg-orange-50 shadow-lg transform scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 hover:shadow-md hover:transform hover:translate-x-1'
          }`}
        >
          <div className="flex items-start gap-4">
            <span
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                selectedOption === 'A'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              A
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{question.optionA.text}</p>
            </div>
          </div>
        </button>

        {/* 옵션 B */}
        <button
          onClick={() => onSelect('B')}
          className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
            selectedOption === 'B'
              ? 'border-orange-500 bg-orange-50 shadow-lg transform scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 hover:shadow-md hover:transform hover:translate-x-1'
          }`}
        >
          <div className="flex items-start gap-4">
            <span
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                selectedOption === 'B'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              B
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{question.optionB.text}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default QuestionCard
