import { MBTIResult } from '../../types/mbti'
import { useTranslation } from '../../hooks/useTranslation'

interface ResultCardProps {
  result: MBTIResult
}

function ResultCard({ result }: ResultCardProps) {
  const { t } = useTranslation()
  const typeKey = result.type.toUpperCase()

  const title = t(`mbti.types.${typeKey}.title`)
  const subtitle = t(`mbti.types.${typeKey}.subtitle`)
  const traits = [1, 2, 3, 4, 5].map(i => t(`mbti.types.${typeKey}.trait${i}`))
  const quote = t(`mbti.types.${typeKey}.quote`)

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      {/* 이모지와 타입 */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{result.emoji}</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{result.type}</h1>
        <p className="text-2xl text-orange-600 font-semibold mb-1">{title}</p>
        <p className="text-xl text-gray-600">{subtitle}</p>
      </div>

      <hr className="my-8 border-gray-200" />

      {/* 특징 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>✨</span>
          {t('mbti.result.yourTraits')}
        </h2>
        <ul className="space-y-3">
          {traits.map((trait, index) => (
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
          {t('mbti.result.inAWord')}
        </h2>
        <p className="text-lg text-gray-800 italic">"{quote}"</p>
      </div>

      {/* 잘 맞는 유형 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>🎯</span>
          {t('mbti.result.compatibleTypes')}
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
          {t('mbti.result.statistics')}
        </h2>
        <div className="flex items-center gap-4 text-gray-600">
          <span>
            {t('mbti.result.ofAll')} <span className="font-bold text-orange-600">{result.percentage}%</span>
          </span>
          <span className="text-gray-300">|</span>
          <span>
            {t('mbti.result.rarity')} <span className="font-bold text-orange-600">{result.rank}{t('mbti.result.rankSuffix')}</span>/16
            {result.rank <= 3 && ' 🏆'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ResultCard
