'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, LogOut, Plus, List } from 'lucide-react'
import JobModal from '@/components/modals/JobModal'
import JobSwipeCard from '@/components/cards/JobSwipeCard'
import { getJobs, getLikedItems, getPassedItems } from '@/lib/backend'
import { createSwipe } from '@/lib/backend'
import { JobOffer } from '@/lib/types'

export default function JobseekerSwipePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [jobs, setJobs] = useState<JobOffer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'jobseeker') {
      router.push('/')
      return
    }

    const liked = getLikedItems(user.id, 'job')
    const passed = getPassedItems(user.id, 'job')
    const allJobs = getJobs()
    const available = allJobs.filter(
      j => !liked.includes(j.id) && !passed.includes(j.id)
    )
    setJobs(available)
  }, [user, router])

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating || currentIndex >= jobs.length) return

    setIsAnimating(true)
    const currentJob = jobs[currentIndex]

    if (user && currentJob) {
      createSwipe({
        userId: user.id,
        itemId: currentJob.id,
        type: 'job',
        action: direction === 'right' ? 'like' : 'pass',
      })
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsAnimating(false)
    }, 300)
  }

  const handleJobClick = (job: JobOffer) => {
    setSelectedJob(job)
    setIsJobModalOpen(true)
  }

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  const currentJobs = jobs.slice(currentIndex, currentIndex + 3)

  if (!user || user.role !== 'jobseeker') {
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
            Trouvez votre job
          </h1>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/jobseeker/my-jobs')}
                className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                title="Mes offres retenues"
              >
                <List className="w-5 h-5 text-purple-600" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/jobseeker/add-cv')}
                className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                title="Ajouter mon CV"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
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
          {currentJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl shadow-xl"
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Plus d'offres !</h2>
                <p className="text-gray-600 mb-6">
                  Vous avez parcouru toutes les offres disponibles.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/jobseeker/my-jobs')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
                >
                  Voir mes offres retenues
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {currentJobs.map((job, index) => (
                <JobSwipeCard
                  key={job.id}
                  job={job}
                  onSwipe={handleSwipe}
                  onJobClick={handleJobClick}
                  index={index}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Boutons d'action */}
        {currentJobs.length > 0 && (
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
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwipe('right')}
              disabled={isAnimating}
              className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-green-200 hover:border-green-400 transition-colors disabled:opacity-50"
            >
              <Heart className="w-8 h-8 text-green-500 fill-green-500" />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Modal Job */}
      <JobModal
        job={selectedJob}
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
      />
    </div>
  )
}

