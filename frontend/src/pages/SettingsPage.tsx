import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Household } from '../types/user'
import { generatePKCEPair } from '../utils/pkce'
import { SUPPORTED_LANGUAGES, getLanguageName } from '../constants/languages'
import AlertBanner from '../components/AlertBanner'
import {
  UserIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  UserPlusIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  LanguageIcon
} from '@heroicons/react/24/outline'
import { getRandomSettingsHumor } from '../utils/humor'

function SettingsPage() {
  const { user, household, createHousehold, joinHousehold, leaveHousehold, logout, refreshUser } = useAuth()
  const [householdData, setHouseholdData] = useState<Household | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create household form
  const [createForm, setCreateForm] = useState({ name: '' })
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Join household form
  const [joinForm, setJoinForm] = useState({ inviteCode: '' })
  const [showJoinForm, setShowJoinForm] = useState(false)

  // Regenerate invite code
  const [regeneratingCode, setRegeneratingCode] = useState(false)

  // Copy invite code feedback
  const [codeCopied, setCodeCopied] = useState(false)

  // Translation preference
  const [translationLanguage, setTranslationLanguage] = useState<string>(user?.defaultTranslationLanguage || '')
  const [isSavingLanguage, setIsSavingLanguage] = useState(false)

  useEffect(() => {
    if (household) {
      loadHouseholdDetails()
    }
  }, [household])

  useEffect(() => {
    setTranslationLanguage(user?.defaultTranslationLanguage || '')
  }, [user?.defaultTranslationLanguage])

  const loadHouseholdDetails = async () => {
    if (!household) return

    try {
      setLoading(true)
      const response = await apiService.getCurrentHousehold()
      setHouseholdData(response.household)
    } catch (err) {
      console.error('Failed to load household details:', err)
      setError('Failed to load household details')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) return

    try {
      setLoading(true)
      setError(null)
      await createHousehold({ name: createForm.name.trim() })
      setCreateForm({ name: '' })
      setShowCreateForm(false)
      setSuccess('Household created successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create household')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinForm.inviteCode.trim()) return

    try {
      setLoading(true)
      setError(null)
      await joinHousehold({ inviteCode: joinForm.inviteCode.trim() })
      setJoinForm({ inviteCode: '' })
      setShowJoinForm(false)
      setSuccess('Successfully joined household!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join household')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveHousehold = async () => {
    if (!confirm('Are you sure you want to leave this household? You will lose access to all household recipes.')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await leaveHousehold()
      setSuccess('Successfully left household')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave household')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateInviteCode = async () => {
    if (!confirm('Are you sure you want to regenerate the invite code? The old code will no longer work.')) {
      return
    }

    try {
      setRegeneratingCode(true)
      setError(null)
      const response = await apiService.regenerateInviteCode()
      setHouseholdData(response.household)
      setSuccess('Invite code regenerated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate invite code')
    } finally {
      setRegeneratingCode(false)
    }
  }

  const copyInviteCode = async () => {
    if (!householdData?.inviteCode) return

    try {
      await navigator.clipboard.writeText(householdData.inviteCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy invite code:', err)
    }
  }

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return
    }

    try {
      await logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out')
    }
  }

  const handleSaveTranslationPreference = async () => {
    try {
      setIsSavingLanguage(true)
      setError(null)

        await apiService.updateTranslationPreference(translationLanguage || null)

        await refreshUser()

      setSuccess('Translation preference updated successfully!')
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update translation preference')
    } finally {
      setIsSavingLanguage(false)
    }
  }

  const handleChangeGoogleAccount = async () => {
    try {
      // Generate PKCE pair for enhanced security
      const { codeVerifier, codeChallenge } = await generatePKCEPair()

      // Build URL with PKCE challenge/verifier and prompt parameter
      const baseUrl = import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`
      const url = `${baseUrl}/auth/google?prompt=select_account&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&code_verifier=${encodeURIComponent(codeVerifier)}`

      // For PWA compatibility, ensure proper navigation
      try {
        // Clear any cached Google session data that might interfere with PWA keyboard
        if ('serviceWorker' in navigator) {
          // Force a clean navigation for PWA environments
          window.location.href = url
        } else {
          // Regular browser navigation
          window.location.assign(url)
        }
      } catch (error) {
        console.error('Navigation error:', error)
        // Fallback to simple assignment
        window.location.href = url
      }
    } catch (error) {
      console.error('Failed to generate PKCE pair:', error)
      setError('Failed to initiate Google account change. Please try again.')
    }
  }

  if (!user) {
    return (
      <div className="px-4 py-8 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <p className="text-gray-600 dark:text-gray-400">Please log in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Cog6ToothIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Settings & Profile
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto italic">
          {getRandomSettingsHumor()}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <AlertBanner
          variant="success"
          description={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      {/* Error Message */}
      {error && (
        <AlertBanner
          variant="error"
          description={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {user.displayName}
              </h3>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <EnvelopeIcon className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Language Preferences Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <LanguageIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Language Preferences
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="translationLanguage" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Default Translation Language
            </label>
              <select
                id="translationLanguage"
                value={translationLanguage}
                onChange={(e) => setTranslationLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-200/50 bg-white/80 px-3 py-2 text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:focus:border-blue-400"
              >
              <option value="">No Translation (Keep Original Language)</option>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Set your preferred language for imported recipes. When you import recipes from URLs, text, or images, they will be automatically translated to this language. You can override this setting for individual imports.
            </p>
            {translationLanguage && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                <strong>Current setting:</strong> Recipes will be translated to {getLanguageName(translationLanguage)}
              </p>
            )}
          </div>

          <button
            onClick={handleSaveTranslationPreference}
            disabled={isSavingLanguage}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSavingLanguage ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                Save Preference
              </>
            )}
          </button>
        </div>
      </div>

      {/* Household Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <UserGroupIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Household Management
          </h2>
        </div>

        {household ? (
          /* Existing Household */
          <div className="space-y-6">
            {/* Current Household Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {household.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <UserGroupIcon className="w-4 h-4" />
                  {householdData?.members?.length || 0} members
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Created {new Date(household.createdAt).toLocaleDateString()}
              </p>

              {/* Members List */}
              {householdData?.members && householdData.members.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Members:
                  </h4>
                  <div className="grid gap-3">
                    {householdData.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {member.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.displayName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Invite Code Section */}
            {householdData?.inviteCode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlusIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Invite New Members
                  </h4>
                </div>

                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Share this invite code with family members:
                </p>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-white dark:bg-blue-900/50 border border-blue-300 dark:border-blue-600 rounded-lg p-2">
                    <code className="text-sm font-mono text-blue-900 dark:text-blue-100">
                      {householdData.inviteCode}
                    </code>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {codeCopied ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleRegenerateInviteCode}
                  disabled={regeneratingCode}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-800/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {regeneratingCode ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-4 h-4" />
                      Regenerate Code
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Leave Household */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                Leave Household
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                If you leave this household, you will lose access to all household recipes.
              </p>
              <button
                onClick={handleLeaveHousehold}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Leaving...
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    Leave Household
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* No Household - Create or Join */
          <div className="space-y-6">
            <div className="text-center py-6">
              <UserGroupIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Household Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create a household for your family or join an existing one.
              </p>
            </div>

            {/* Create Household */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Create New Household
                </h4>
                {!showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <HomeIcon className="w-4 h-4" />
                    Create
                  </button>
                )}
              </div>

              {showCreateForm && (
                <form onSubmit={handleCreateHousehold} className="space-y-3">
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ name: e.target.value })}
                    placeholder="Household name (e.g., The Smith Family)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                    autoComplete="off"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || !createForm.name.trim()}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <HomeIcon className="w-4 h-4" />
                          Create
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        setCreateForm({ name: '' })
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {!showCreateForm && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start a new household to share recipes with your family.
                </p>
              )}
            </div>

            {/* Join Household */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Join Existing Household
                </h4>
                {!showJoinForm && (
                  <button
                    onClick={() => setShowJoinForm(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Join
                  </button>
                )}
              </div>

              {showJoinForm && (
                <form onSubmit={handleJoinHousehold} className="space-y-3">
                  <input
                    type="text"
                    value={joinForm.inviteCode}
                    onChange={(e) => setJoinForm({ inviteCode: e.target.value })}
                    placeholder="Enter invite code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                    required
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || !joinForm.inviteCode.trim()}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Joining...
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-4 h-4" />
                          Join
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowJoinForm(false)
                        setJoinForm({ inviteCode: '' })
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {!showJoinForm && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Have an invite code? Use it to join a family household.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Account Actions
          </h2>
        </div>

        <div className="flex gap-3">
          {/* Change Google Account - Only show if user has Google ID */}
          {user.googleId && (
            <button
              onClick={handleChangeGoogleAccount}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Change Google Account
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage