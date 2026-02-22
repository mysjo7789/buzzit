const PrivacyPage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보 처리방침</h1>
        <p className="text-xs text-gray-400">최종 수정일: 2026년 2월 21일</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. 수집하는 정보</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Buzzit은 서비스 이용 과정에서 다음과 같은 정보를 수집할 수 있습니다.
        </p>
        <h3 className="text-sm font-medium text-gray-800 mt-2">자동 수집 정보</h3>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>접속 로그 (IP 주소, 접속 시간, 브라우저 종류)</li>
          <li>쿠키 및 유사 기술을 통한 이용 패턴 정보</li>
          <li>기기 정보 (운영체제, 화면 해상도)</li>
        </ul>
        <h3 className="text-sm font-medium text-gray-800 mt-2">소셜 로그인 시 수집 정보</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          댓글 작성 등의 기능 이용을 위해 소셜 로그인 시, 해당 플랫폼으로부터 다음 정보를 제공받습니다.
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>Google 로그인: 이메일 주소, 프로필 이미지</li>
          <li>카카오 로그인: 닉네임, 프로필 이미지, 이메일 주소(선택)</li>
        </ul>
        <p className="text-sm text-gray-600 leading-relaxed mt-2">
          게시글 조회만 하는 경우 별도의 개인정보를 수집하지 않습니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">2. 정보의 이용 목적</h2>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>서비스 제공 및 운영</li>
          <li>회원 식별 및 댓글 기능 제공</li>
          <li>서비스 이용 통계 분석 및 개선</li>
          <li>광고 게재 및 맞춤형 콘텐츠 제공</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">3. 쿠키 및 광고</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Buzzit은 Google AdSense를 통해 광고를 게재할 수 있습니다.
          Google은 사용자의 관심사에 기반한 광고를 표시하기 위해 쿠키를 사용합니다.
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>Google은 DART 쿠키를 사용하여 사용자의 웹사이트 방문 기록을 기반으로 광고를 게재합니다.</li>
          <li>사용자는 <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google 광고 설정</a>에서 맞춤 광고를 비활성화할 수 있습니다.</li>
          <li>쿠키 사용을 원하지 않는 경우, 브라우저 설정에서 쿠키를 비활성화할 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">4. 제3자 제공 및 외부 링크</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Buzzit은 수집한 개인정보를 제3자에게 제공하지 않습니다.
          다만, 서비스 내에서 외부 커뮤니티 사이트의 게시글 링크를 제공하며,
          해당 사이트로 이동 시 해당 사이트의 개인정보 처리방침이 적용됩니다.
          Buzzit은 외부 사이트의 개인정보 처리에 대해 책임지지 않습니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">5. 정보의 보관 및 삭제</h2>
        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>소셜 로그인을 통해 수집된 정보는 회원 탈퇴 시 지체 없이 삭제됩니다.</li>
          <li>자동 수집된 접속 로그는 서비스 운영 목적으로 일정 기간 보관 후 삭제됩니다.</li>
          <li>쿠키는 브라우저 설정을 통해 사용자가 직접 삭제할 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">6. 이용자의 권리</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          이용자는 언제든지 자신의 개인정보 열람, 수정, 삭제를 요청할 수 있으며,
          아래 이메일을 통해 문의하실 수 있습니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">7. 문의</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          개인정보 처리방침에 대한 문의사항은 아래 이메일로 연락해 주시기 바랍니다.
        </p>
        <p className="text-sm text-gray-600">
          이메일: <span className="text-gray-900">buzzit7789@gmail.com</span>
        </p>
      </section>
    </div>
  )
}

export default PrivacyPage
