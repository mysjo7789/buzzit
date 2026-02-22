import { TrendingUp, Globe, Zap, Shield } from 'lucide-react'

const AboutPage = () => {
  const features = [
    {
      icon: TrendingUp,
      title: '실시간 트렌드',
      description: '주요 커뮤니티 사이트의 인기글을 실시간으로 수집하여 제공합니다.',
    },
    {
      icon: Globe,
      title: '다양한 소스',
      description: '에펨코리아, 웃긴대학, 루리웹, 클리앙 등 다양한 커뮤니티의 콘텐츠를 한곳에서 확인하세요.',
    },
    {
      icon: Zap,
      title: '빠른 업데이트',
      description: '30분마다 자동 크롤링으로 최신 인기글을 빠르게 업데이트합니다.',
    },
    {
      icon: Shield,
      title: '안전한 접근',
      description: '원본 사이트로의 직접 링크를 통해 안전하게 콘텐츠를 확인할 수 있습니다.',
    },
  ]

  const sites = [
    { name: '에펨코리아', code: 'fmkorea' },
    { name: '웃긴대학', code: 'humoruniv' },
    { name: '루리웹', code: 'ruliweb' },
    { name: '이토랜드', code: 'etoland' },
    { name: '인벤', code: 'inven' },
    { name: '클리앙', code: 'clien' },
    { name: 'MLB파크', code: 'mlbpark' },
    { name: '딴지일보', code: 'ddanzi' },
    { name: '보배드림', code: 'bobaedream' },
    { name: '뽐뿌', code: 'ppomppu' },
    { name: 'SLR클럽', code: 'slrclub' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buzzit 소개</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Buzzit은 국내 주요 커뮤니티 사이트의 인기 게시글을 한곳에서 모아볼 수 있는 큐레이션 서비스입니다.
          각 커뮤니티의 인기글을 자동으로 수집하여, 지금 가장 화제가 되는 콘텐츠를 빠르게 확인할 수 있습니다.
        </p>
      </div>

      {/* 주요 기능 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">주요 기능</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Icon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 지원 사이트 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">지원 커뮤니티</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {sites.map((site) => (
              <span
                key={site.code}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
              >
                {site.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 문의 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">문의</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          버그 리포트, 기능 제안, 또는 기타 문의사항이 있으시면 아래 이메일로 연락해 주세요.
        </p>
        <p className="text-sm text-gray-600">
          이메일: <span className="text-gray-900">buzzit7789@gmail.com</span>
        </p>
        <p className="text-xs text-gray-400 mt-4">
          © 2025 Buzzit. All rights reserved.
        </p>
      </section>
    </div>
  )
}

export default AboutPage
