import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshUser, user, isLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error parameters from OAuth provider
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          let errorMessage = 'Authentication failed'

          if (error === 'access_denied') {
            errorMessage = 'You cancelled the authentication process'
          } else if (errorDescription) {
            errorMessage = errorDescription
          }

          setError(errorMessage)
          setIsProcessing(false)

          // Redirect to login with error after a delay
          setTimeout(() => {
            navigate('/login?error=auth_cancelled')
          }, 3000)
          return
        }

        // If we have a success code or no error, refresh user data
        await refreshUser()
        setIsProcessing(false)
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Failed to complete authentication')
        setIsProcessing(false)

        // Redirect to login with error after a delay
        setTimeout(() => {
          navigate('/login?error=callback_failed')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [searchParams, refreshUser, navigate])

  useEffect(() => {
    // Once we have the user data and processing is complete, redirect
    if (!isProcessing && !isLoading && user) {
      navigate('/dashboard')
    } else if (!isProcessing && !isLoading && !user && !error) {
      // No user and no error means auth failed silently
      navigate('/login?error=auth_failed')
    }
  }, [isProcessing, isLoading, user, error, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Failed</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-blue-600 dark:text-blue-400 mb-4">
          <svg className="w-16 h-16 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Completing Authentication</h1>
        <p className="text-gray-600 dark:text-gray-400">Please wait while we finish setting up your account...</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage