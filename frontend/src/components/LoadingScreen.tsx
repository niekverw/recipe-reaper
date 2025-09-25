import React from 'react'
import Logo from './Logo'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading Recipe Reaper...'
}) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center z-50 transition-colors duration-200">
      <div className="flex flex-col items-center space-y-6">
        <div className="animate-pulse">
          <Logo className="w-24 h-24 text-gray-800 dark:text-white" />
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen