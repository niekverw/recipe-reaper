import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  if (!isOpen) return null

  const handleSuccess = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 z-[99]"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl relative z-[101]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="mt-2">
            {mode === 'login' ? (
              <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setMode('register')}
              />
            ) : (
              <RegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal