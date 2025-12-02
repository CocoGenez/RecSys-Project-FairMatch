'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, LogOut, Plus, List } from 'lucide-react'
import FlipCard from '@/components/cards/FlipCard'
import CVModal from '@/components/modals/CVModal'
import { getCandidates, getLikedItems, getPassedItems } from '@/lib/backend'
import { createSwipe } from '@/lib/backend'
import { Candidate } from '@/lib/types'

export default function RecruiterSwipePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isCVModalOpen, setIsCVModalOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'recruiter') {
      router.push('/')
      return
    }

    const liked = getLikedItems(user.id, 'candidate')
    const passed = getPassedItems(user.id, 'candidate')
    const allCandidates = getCandidates()
    const available = allCandidates.filter(
      c => !liked.includes(c.id) && !passed.includes(c.id)
    )
    setCandidates(available)
  }, [user, router])

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating || currentIndex >= candidates.length) return

    setIsAnimating(true)
    const currentCandidate = candidates[currentIndex]

    if (user && currentCandidate) {
      createSwipe({
        userId: user.id,
        itemId: currentCandidate.id,
        type: 'candidate',
        action: direction === 'right' ? 'like' : 'pass',
      })
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsAnimating(false)
    }, 300)
  }

  const handleViewCV = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsCVModalOpen(true)
  }

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  const currentCandidates = candidates.slice(currentIndex, currentIndex + 3)

  if (!user || user.role !== 'recruiter') {
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
            Trouvez des candidats
          </h1>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/recruiter/jobs')}
                className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                title="Mes offres"
              >
                <List className="w-5 h-5 text-purple-600" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/recruiter/add-job')}
                className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                title="Ajouter un job"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/recruiter/my-candidates')}
              className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              title="Mes candidats"
            >
              <Heart className="w-5 h-5 text-purple-600" />
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
        <div className="relative h-[600px] mb-6 flex items-center justify-center">
          {currentCandidates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl shadow-xl"
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Plus de candidats !</h2>
                <p className="text-gray-600 mb-6">
                  Vous avez parcouru tous les candidats disponibles.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/recruiter/my-candidates')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
                >
                  Voir mes candidats retenus
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {currentCandidates.map((candidate, index) => (
                <FlipCard
                  key={candidate.id}
                  candidate={candidate}
                  onSwipe={handleSwipe}
                  index={index}
                  onViewCV={handleViewCV}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Boutons d'action */}
        {currentCandidates.length > 0 && (
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

      {/* Modal CV */}
      <CVModal
        candidate={selectedCandidate}
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
      />
    </div>
  )
}


