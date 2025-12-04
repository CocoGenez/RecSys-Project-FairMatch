'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, LogOut, Plus, List } from 'lucide-react'
import JobModal from '@/components/modals/JobModal'
import JobSwipeCard from '@/components/cards/JobSwipeCard'
import { JobOffer as JobOfferType } from '@/lib/types'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useSwipe } from '@/hooks/useSwipe'

export default function JobseekerSwipePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { items, refresh, isLoading } = useRecommendations()
  
  // Use callback for reliable triggering
  const { isAnimating, handleSwipe, currentItems, currentIndex } = useSwipe(items, () => {
    console.log("[JobseekerSwipePage] onFinished callback triggered")
    refresh()
  })

  // Auto-refresh fallback
  useEffect(() => {
    if (currentItems.length === 0 && !isLoading && items.length > 0) {
      console.log("[JobseekerSwipePage] Triggering refresh from effect...")
      refresh()
    }
  }, [currentItems.length, isLoading, items.length])
  
  console.log("SwipePage render:", { 
    totalItems: items.length, 
    currentItemsLength: currentItems.length, 
    currentIndex,
    isLoading
  })

  const [selectedJob, setSelectedJob] = useState<JobOfferType | null>(null)

  const [isJobModalOpen, setIsJobModalOpen] = useState(false)

  // Adapt items (from lib/data) to JobOfferType (from lib/types) for the card/modal
  const adaptedCurrentJobs: JobOfferType[] = currentItems.map((item: any) => ({
    id: item.id,
    recruiterId: '0', // Mock
    title: item.title,
    company: item.company,
    location: item.location,
    objectives: item.description, // Map description to objectives
    startDate: 'Dès que possible',
    requiredQualities: item.requiredSkills || [], // Map skills to qualities
    descriptionType: 'text',
    description: item.description,
    createdAt: Date.now(),
    role: item.role,
    country: item.country,
    experience: item.experience,
    qualifications: item.qualifications,
    workType: item.workType,
    companyBucket: item.companyBucket,
    benefits: item.benefits,
    companyProfile: item.companyProfile,
    salaryRange: item.salaryRange,
    skills: item.skills
  }))

  const handleJobClick = (job: JobOfferType) => {
    setSelectedJob(job)
    setIsJobModalOpen(true)
  }

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  if (!user || user.role !== 'jobseeker') {
    return null
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Find your job
          </h1>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/jobseeker/my-jobs')}
                className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                title="My saved jobs"
              >
                <List className="w-5 h-5 text-purple-600" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/jobseeker/add-cv')}
                className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                title="Add my CV"
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

        {/* Swipe Zone - Full height with side buttons */}
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          {isLoading ? (
             <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl shadow-xl"
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4 animate-bounce">🔄</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
                <p className="text-gray-600">
                  Finding the best jobs for you...
                </p>
              </div>
            </motion.div>
          ) : adaptedCurrentJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl shadow-xl"
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No more offers!</h2>
                <p className="text-gray-600 mb-6">
                  You have browsed all available offers.
                </p>
                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/jobseeker/my-jobs')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold shadow-lg"
                  >
                    View my saved jobs
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => refresh()}
                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-full font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Try to load more
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Pass Button - Left Side */}
              {adaptedCurrentJobs.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.2, rotate: -15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSwipe('left')}
                  disabled={isAnimating}
                  className="absolute -left-10 z-20 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-red-200 hover:border-red-400 transition-colors disabled:opacity-50 hover:bg-red-50"
                  title="Pass"
                >
                  <X className="w-7 h-7 text-red-500" />
                </motion.button>
              )}

              {/* Job Cards */}
              <AnimatePresence>
                {adaptedCurrentJobs.map((job, index) => (
                  <JobSwipeCard
                    key={job.id}
                    job={job}
                    onSwipe={handleSwipe}
                    onJobClick={handleJobClick}
                    index={index}
                  />
                ))}
              </AnimatePresence>

              {/* Like Button - Right Side */}
              {adaptedCurrentJobs.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSwipe('right')}
                  disabled={isAnimating}
                  className="absolute -right-10 z-20 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-green-200 hover:border-green-400 transition-colors disabled:opacity-50 hover:bg-green-50"
                  title="Like"
                >
                  <Heart className="w-7 h-7 text-green-500 fill-green-500" />
                </motion.button>
              )}
            </>
          )}
        </div>
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



// Force rebuild for HMR - Swipe Card Updated
