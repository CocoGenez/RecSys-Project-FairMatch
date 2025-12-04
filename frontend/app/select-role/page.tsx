'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Briefcase, UserSearch, Sparkles } from 'lucide-react'
import { useEffect } from 'react'

export default function SelectRolePage() {
  const router = useRouter()
  const { user, setUserRole } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role) {
      router.push('/swipe')
    }
  }, [user, router])

  const handleRoleSelect = (role: 'recruiter' | 'jobseeker') => {
    setUserRole(role)
    router.push('/swipe')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-6 shadow-lg"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
          >
            Choose your role
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600"
          >
            How would you like to use FairMatch?
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRoleSelect('recruiter')}
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border-2 border-purple-200 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                <Briefcase className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Recruiter</h2>
              <p className="text-gray-600 text-lg mb-6">
                Find the best candidates for your company. Swipe right on the profiles that interest you!
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
                Get started
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="ml-2"
                >
                  →
                </motion.span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRoleSelect('jobseeker')}
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border-2 border-pink-200 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                <UserSearch className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Job seeker</h2>
              <p className="text-gray-600 text-lg mb-6">
                Discover job offers that match your skills. Swipe right on the ones you like!
              </p>
              <div className="flex items-center text-pink-600 font-semibold group-hover:text-pink-700">
                Get started
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="ml-2"
                >
                  →
                </motion.span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}






