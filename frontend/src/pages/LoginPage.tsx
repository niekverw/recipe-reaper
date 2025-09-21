import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/auth/LoginForm'

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Handle OAuth errors from URL parameters
    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'auth_failed':
          setError('Google authentication failed. Please try again.')
          break
        case 'login_failed':
          setError('Login failed after authentication. Please try again.')
          break
        default:
          setError('Authentication error occurred. Please try again.')
      }
    }
  }, [searchParams])

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user && !isLoading) {
      navigate('/dashboard')
    }
  }, [user, isLoading, navigate])

  const handleLoginSuccess = () => {
    navigate('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recipe Reaper</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Your personal recipe collection</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  )
}

export default LoginPage