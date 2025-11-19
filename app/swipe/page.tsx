'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, LogOut, List } from 'lucide-react'
import SwipeCard from '@/components/SwipeCard'
import { mockCandidates, mockJobOffers, Candidate, JobOffer } from '@/lib/data'
import { saveSwipe, getLikedItems, getPassedItems, hasSwiped } from '@/lib/swipes'

export default function SwipePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [items, setItems] = useState<(Candidate | JobOffer)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!user.role) {
      router.push('/select-role')
      return
    }

    // Charger les items selon le rôle
    if (user.role === 'recruiter') {
      const liked = getLikedItems(user.id, 'candidate')
      const passed = getPassedItems(user.id, 'candidate')
      const available = mockCandidates.filter(
        c => !liked.includes(c.id) && !passed.includes(c.id)
      )
      setItems(available)
    } else {
      const liked = getLikedItems(user.id, 'job')
      const passed = getPassedItems(user.id, 'job')
      const available = mockJobOffers.filter(
        j => !liked.includes(j.id) && !passed.includes(j.id)
      )
      setItems(available)
    }
  }, [user, router])

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating || currentIndex >= items.length) return

    setIsAnimating(true)
    const currentItem = items[currentIndex]

    if (user && currentItem) {
      const itemType = user.role === 'recruiter' ? 'candidate' : 'job'
      const action = direction === 'right' ? 'like' : 'pass'
      saveSwipe(user.id, currentItem.id, itemType, action)
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsAnimating(false)
    }, 300)
  }

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  const currentItems = items.slice(currentIndex, currentIndex + 3)

  if (!user || !user.role) {
    return null
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {user.role === 'recruiter' ? 'Trouvez des candidats' : 'Trouvez votre job'}
          </h1>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push(user.role === 'recruiter' ? '/my-candidates' : '/my-jobs')}
              className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <List className="w-5 h-5 text-purple-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </motion.div>

        {/* Zone de swipe */}
        <div className="relative h-[600px] mb-6">
          {currentItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl shadow-xl"
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Plus de profils !</h2>
                <p className="text-gray-600 mb-6">
                  Vous avez parcouru tous les profils disponibles.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(user.role === 'recruiter' ? '/my-candidates' : '/my-jobs')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
                >
                  Voir mes sélections
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {currentItems.map((item, index) => (
                <SwipeCard
                  key={item.id}
                  candidate={user.role === 'recruiter' ? (item as Candidate) : undefined}
                  jobOffer={user.role === 'jobseeker' ? (item as JobOffer) : undefined}
                  onSwipe={handleSwipe}
                  index={index}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Boutons d'action */}
        {currentItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('left')}
              disabled={isAnimating}
              className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-red-200 hover:border-red-400 transition-colors disabled:opacity-50"
            >
              <X className="w-8 h-8 text-red-500" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('right')}
              disabled={isAnimating}
              className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-green-200 hover:border-green-400 transition-colors disabled:opacity-50"
            >
              <Heart className="w-8 h-8 text-green-500 fill-green-500" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}



