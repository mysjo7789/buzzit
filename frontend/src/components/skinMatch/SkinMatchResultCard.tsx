import { SkinMatchCeleb } from '../../types/skinMatch'
import { useTranslation } from '../../hooks/useTranslation'

interface SkinMatchResultCardProps {
  celeb: SkinMatchCeleb
}

function SkinMatchResultCard({ celeb }: SkinMatchResultCardProps) {
  const { locale } = useTranslation()
  const isKo = locale === 'ko'

  const name = isKo ? celeb.name : celeb.nameEn
  const title = isKo ? celeb.title : celeb.titleEn
  const description = isKo ? celeb.description : celeb.descriptionEn

  const isBomb = celeb.type === 'bomb'
  const bgGradient = isBomb
    ? 'from-red-500 to-orange-500'
    : 'from-purple-500 to-pink-500'
  const accentColor = isBomb ? 'text-red-600' : 'text-purple-600'
  const accentBg = isBomb ? 'bg-red-50' : 'bg-purple-50'

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto animate-fadeIn">
      {/* 상단 그라디언트 헤더 */}
      <div className={`bg-gradient-to-r ${bgGradient} px-6 py-4 text-center`}>
        <span className="text-4xl">{celeb.emoji}</span>
        <p className="text-white/90 text-sm font-medium mt-1">
          {isKo ? 'AI 피부 닮은꼴' : 'AI Skin Match'}
        </p>
      </div>

      {/* 연예인 이미지 */}
      <div className="flex justify-center -mt-2 relative z-10">
        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-8">
          <img
            src={celeb.imagePath}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 결과 정보 */}
      <div className="px-6 pb-8 text-center">
        <h2 className={`text-lg font-bold ${accentColor} mt-4`}>{title}</h2>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
          {name} {isKo ? '타입' : 'Type'}
        </h1>

        <div className={`${accentBg} rounded-xl p-4 mt-6`}>
          <p className="text-gray-700 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default SkinMatchResultCard
