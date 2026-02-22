const TermsPage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
        <p className="text-xs text-gray-400">최종 수정일: 2026년 2월 21일</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. 서비스 개요</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Buzzit(이하 "서비스")은 국내 주요 커뮤니티 사이트의 인기 게시글을
          수집하여 한곳에서 편리하게 확인할 수 있도록 제공하는 큐레이션 서비스입니다.
          서비스를 이용함으로써 본 약관에 동의하는 것으로 간주됩니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">2. 콘텐츠 및 저작권</h2>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>Buzzit에 표시되는 게시글 제목 및 링크는 각 원본 사이트에 귀속됩니다.</li>
          <li>Buzzit은 원본 콘텐츠를 복제·배포하지 않으며, 원본 사이트로의 링크만 제공합니다.</li>
          <li>각 게시글의 저작권은 해당 게시글 작성자 및 원본 사이트에 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">3. 회원가입 및 로그인</h2>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>서비스의 게시글 조회는 별도의 로그인 없이 이용 가능합니다.</li>
          <li>댓글 작성 등 일부 기능은 Google 또는 카카오 계정을 통한 소셜 로그인이 필요합니다.</li>
          <li>소셜 로그인 시 해당 플랫폼으로부터 제공받는 정보는 개인정보처리방침에 따라 처리됩니다.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">4. 서비스 이용</h2>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>서비스는 무료로 제공됩니다.</li>
          <li>서비스 내 광고가 게재될 수 있으며, 이는 서비스 운영을 위한 것입니다.</li>
          <li>사용자는 서비스를 개인적, 비상업적 용도로만 이용하여야 합니다.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">5. 금지 행위</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          다음 행위는 금지됩니다.
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>자동화된 수단을 이용한 대량 접근 또는 데이터 수집</li>
          <li>서비스의 보안을 위협하는 행위</li>
          <li>타인을 비방하거나 불쾌감을 주는 댓글 작성</li>
          <li>기타 관련 법령에 위반되는 행위</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">6. 면책 조항</h2>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>Buzzit은 외부 사이트 게시글의 정확성, 신뢰성, 적법성에 대해 보증하지 않습니다.</li>
          <li>외부 사이트 이용 시 발생하는 문제에 대해 Buzzit은 책임을 지지 않습니다.</li>
          <li>서비스는 기술적 사유로 예고 없이 중단될 수 있습니다.</li>
          <li>크롤링 데이터의 지연 또는 누락이 발생할 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">7. 약관 변경</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          본 약관은 서비스 운영상 필요에 따라 사전 공지 후 변경될 수 있습니다.
          변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">8. 문의</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          이용약관에 대한 문의사항은 아래 이메일로 연락해 주시기 바랍니다.
        </p>
        <p className="text-sm text-gray-600">
          이메일: <span className="text-gray-900">buzzit7789@gmail.com</span>
        </p>
      </section>
    </div>
  )
}

export default TermsPage
