import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Household, LoginData, RegisterData, CreateHouseholdData, JoinHouseholdData } from '../types/user'

interface AuthContextType {
  user: User | null
  household: Household | null
  isLoading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  createHousehold: (data: CreateHouseholdData) => Promise<void>
  joinHousehold: (data: JoinHouseholdData) => Promise<void>
  leaveHousehold: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.authenticated && data.user) {
        setUser(data.user)
        await loadHousehold()
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadHousehold = async () => {
    try {
      const response = await fetch('/api/households/current', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setHousehold(data.household)
      }
    } catch (error) {
      console.error('Failed to load household:', error)
    }
  }

  const login = async (loginData: LoginData) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(loginData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed')
    }

    setUser(data.user)
    await loadHousehold()
  }

  const register = async (registerData: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(registerData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Registration failed')
    }

    setUser(data.user)
    setHousehold(null) // New users don't have households
  }

  const logout = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })

    if (response.ok) {
      setUser(null)
      setHousehold(null)
    } else {
      throw new Error('Logout failed')
    }
  }

  const createHousehold = async (householdData: CreateHouseholdData) => {
    const response = await fetch('/api/households', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(householdData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create household')
    }

    setHousehold(data.household)
    await refreshUser() // Refresh user to get updated household info
  }

  const joinHousehold = async (joinData: JoinHouseholdData) => {
    const response = await fetch('/api/households/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(joinData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to join household')
    }

    setHousehold(data.household)
    await refreshUser() // Refresh user to get updated household info
  }

  const leaveHousehold = async () => {
    const response = await fetch('/api/households/leave', {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to leave household')
    }

    setHousehold(null)
    await refreshUser() // Refresh user to get updated info
  }

  const refreshUser = async () => {
    await checkAuthStatus()
  }

  const value = {
    user,
    household,
    isLoading,
    login,
    register,
    logout,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}