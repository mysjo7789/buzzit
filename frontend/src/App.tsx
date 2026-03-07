import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SitePage from './pages/SitePage'
import PostDetailPage from './pages/PostDetailPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import MBTIStartPage from './pages/MBTIStartPage'
import MBTITestPage from './pages/MBTITestPage'
import MBTIResultPage from './pages/MBTIResultPage'
import SkinMatchTest from './pages/SkinMatchTest'
import SkinMatchResult from './pages/SkinMatchResult'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/site/:siteCode" element={<SitePage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/mbti" element={<MBTIStartPage />} />
        <Route path="/mbti/test" element={<MBTITestPage />} />
        <Route path="/mbti/result" element={<MBTIResultPage />} />
        <Route path="/tests/skin-match" element={<SkinMatchTest />} />
        <Route path="/tests/skin-match/result/:resultId" element={<SkinMatchResult />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
