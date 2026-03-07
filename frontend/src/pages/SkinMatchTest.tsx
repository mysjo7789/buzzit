import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { analyzeSkin } from '../utils/skinMatchApi'
import { createPreviewUrl, revokePreviewUrl } from '../utils/imageProcessor'
import { SkinMatchError } from '../types/skinMatch'

type Step = 'landing' | 'preview' | 'loading' | 'error'

function SkinMatchTest() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('landing')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg(t('skinMatch.error.invalidFormat'))
      setStep('error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(t('skinMatch.error.tooLarge'))
      setStep('error')
      return
    }

    if (previewUrl) revokePreviewUrl(previewUrl)
    const url = createPreviewUrl(file)
    setPreviewUrl(url)
    setSelectedFile(file)
    setStep('preview')
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setStep('loading')

    try {
      const result = await analyzeSkin(selectedFile)
      navigate(`/tests/skin-match/result/${result.result_id}`)
    } catch (err) {
      const skinErr = err as SkinMatchError
      switch (skinErr.error) {
        case 'no_face':
          setErrorMsg(t('skinMatch.error.noFace'))
          break
        case 'too_dark':
          setErrorMsg(t('skinMatch.error.tooDark'))
          break
        case 'too_blurry':
          setErrorMsg(t('skinMatch.error.tooBlurry'))
          break
        default:
          setErrorMsg(t('skinMatch.error.network'))
      }
      setStep('error')
    }
  }

  const handleRetry = () => {
    setStep('landing')
    setSelectedFile(null)
    if (previewUrl) {
      revokePreviewUrl(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Landing */}
        {step === 'landing' && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <div className="text-6xl mb-4">📸</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {t('skinMatch.start.title')}
              </h1>
              <p className="text-lg text-gray-600">
                {t('skinMatch.start.subtitle')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-center gap-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <span className="font-medium">{t('skinMatch.start.ai')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <span className="font-medium">{t('skinMatch.start.duration')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={triggerUpload}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {t('skinMatch.start.uploadButton')}
            </button>

            <p className="mt-6 text-sm text-gray-500">
              🔒 {t('skinMatch.start.privacy')}
            </p>
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && previewUrl && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('skinMatch.preview.title')}
            </h2>

            <div className="relative w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAnalyze}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {t('skinMatch.preview.analyze')}
              </button>
              <button
                onClick={triggerUpload}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-xl shadow-md border-2 border-gray-200 transition-all"
              >
                {t('skinMatch.preview.reselect')}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  🔬
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('skinMatch.loading.title')}
              </h2>
              <p className="text-gray-500">{t('skinMatch.loading.subtitle')}</p>
            </div>

            <div className="space-y-2">
              {[
                t('skinMatch.loading.step1'),
                t('skinMatch.loading.step2'),
                t('skinMatch.loading.step3'),
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm text-gray-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <div className="text-6xl mb-4">😥</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t('skinMatch.error.title')}
              </h2>
              <p className="text-gray-600">{errorMsg}</p>
            </div>

            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {t('skinMatch.error.retry')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SkinMatchTest
