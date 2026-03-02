import { MBTIResult } from '../../types/mbti'

interface ResultCardProps {
  result: MBTIResult
}

function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      {/* 이모지와 타입 */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{result.emoji}</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{result.type}</h1>
        <p className="text-2xl text-orange-600 font-semibold mb-1">{result.title}</p>
        <p className="text-xl text-gray-600">{result.subtitle}</p>
      </div>

      <hr className="my-8 border-gray-200" />

      {/* 특징 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>✨</span>
          당신의 특징
        </h2>
        <ul className="space-y-3">
          {result.traits.map((trait, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-500 mt-2" />
              <span className="text-gray-700">{trait}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 한마디 */}
      <div className="mb-8 bg-orange-50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>💬</span>
          한마디로
        </h2>
        <p className="text-lg text-gray-800 italic">"{result.quote}"</p>
      </div>

      {/* 잘 맞는 유형 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>🎯</span>
          잘 맞는 유형
        </h2>
        <div className="flex gap-3">
          {result.compatible.map((type) => (
            <span
              key={type}
              className="px-4 py-2 bg-orange-100 text-orange-700 font-semibold rounded-lg"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* 통계 */}
      <div className="pt-6 border-t border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>📊</span>
          통계
        </h2>
        <div className="flex items-center gap-4 text-gray-600">
          <span>
            전체 중 <span className="font-bold text-orange-600">{result.percentage}%</span>
          </span>
          <span className="text-gray-300">|</span>
          <span>
            희귀도 <span className="font-bold text-orange-600">{result.rank}위</span>/16
            {result.rank <= 3 && ' 🏆'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ResultCard
