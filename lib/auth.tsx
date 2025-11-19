'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  role?: 'recruiter' | 'jobseeker'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, role?: 'recruiter' | 'jobseeker') => Promise<boolean>
  logout: () => void
  setUserRole: (role: 'recruiter' | 'jobseeker') => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const foundUser = users.find((u: any) => u.email === email && u.password === password)
    
    if (foundUser) {
      const userData = { id: foundUser.id, email: foundUser.email, role: foundUser.role }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return true
    }
    return false
  }

  const register = async (email: string, password: string, role?: 'recruiter' | 'jobseeker'): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    
    if (users.some((u: any) => u.email === email)) {
      return false // Email déjà utilisé
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      role: role || undefined
    }

    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))
    
    const userData = { id: newUser.id, email: newUser.email, role: newUser.role }
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const setUserRole = (role: 'recruiter' | 'jobseeker') => {
    if (user) {
      const updatedUser = { ...user, role }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // Mettre à jour aussi dans la liste des users
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const userIndex = users.findIndex((u: any) => u.id === user.id)
      if (userIndex !== -1) {
        users[userIndex].role = role
        localStorage.setItem('users', JSON.stringify(users))
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


