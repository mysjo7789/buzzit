import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                <span className="text-lg font-bold text-gray-900">Buzzit</span>
              </Link>
              <span className="ml-3 text-xs text-gray-400 hidden sm:inline">
                커뮤니티 인기글 모아보기
              </span>
            </div>

            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-2">
          <nav className="flex items-center justify-center gap-4">
            <Link to="/about" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              소개
            </Link>
            <span className="text-gray-200">|</span>
            <Link to="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              이용약관
            </Link>
            <span className="text-gray-200">|</span>
            <Link to="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              개인정보처리방침
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-xs text-gray-400">buzzit7789@gmail.com</span>
          </nav>
          <p className="text-center text-xs text-gray-300">
            © 2025 Buzzit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
