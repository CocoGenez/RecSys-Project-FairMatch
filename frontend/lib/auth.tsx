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
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Handle errors like 404 Not Found or 401 Unauthorized
        console.error('Login failed:', await response.text());
        return false;
      }

      const loggedInUser = await response.json();
      const userData = { id: loggedInUser.id.toString(), email: loggedInUser.email, role: loggedInUser.role };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;

    } catch (error) {
      console.error('An error occurred during login:', error);
      return false;
    }
  }

  const register = async (email: string, password: string, role: 'recruiter' | 'jobseeker' = 'jobseeker'): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        // Handle errors like 409 Conflict (email already exists)
        console.error('Registration failed:', await response.text());
        return false;
      }

      const newUser = await response.json();
      const userData = { id: newUser.id.toString(), email: newUser.email, role: newUser.role };

      // Automatically log in the user after successful registration
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;

    } catch (error) {
      console.error('An error occurred during registration:', error);
      return false;
    }
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


