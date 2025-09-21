import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ShareTargetPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the shared content
    const handleSharedContent = async () => {
      try {
        // Get URL parameters from the share
        const urlParams = new URLSearchParams(window.location.search)
        const sharedUrl = urlParams.get('url')
        const sharedText = urlParams.get('text')

        if (sharedUrl) {
          // Navigate to add recipe page with the shared URL
          navigate('/add-recipe', {
            state: {
              importUrl: sharedUrl,
              importType: 'url'
            }
          })
        } else if (sharedText) {
          // Navigate to add recipe page with the shared text
          navigate('/add-recipe', {
            state: {
              importText: sharedText,
              importType: 'text'
            }
          })
        } else {
          // No shared content, just go to add recipe
          navigate('/add-recipe')
        }
      } catch (error) {
        console.error('Error handling shared content:', error)
        navigate('/add-recipe')
      }
    }

    handleSharedContent()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Processing shared content...</p>
      </div>
    </div>
  )
}