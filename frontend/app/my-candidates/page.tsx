'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Briefcase, Code, Heart } from 'lucide-react'
import { mockCandidates, Candidate } from '@/lib/data'
import { getLikedItems } from '@/lib/swipes'

export default function MyCandidatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'recruiter') {
      router.push('/swipe')
      return
    }

    const likedIds = getLikedItems(user.id, 'candidate')
    const likedCandidates = mockCandidates.filter(c => likedIds.includes(c.id))
    setCandidates(likedCandidates)
  }, [user, router])

  if (!user || user.role !== 'recruiter') {
    return null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/swipe')}
            className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            My selected candidates
          </h1>
        </motion.div>

        {candidates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No candidates selected</h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find candidates that interest you !
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/swipe')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
            >
              Start swiping
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-purple-100"
              >
                <div className="relative h-64 bg-gradient-to-br from-purple-400 to-pink-400">
                  <img
                    src={candidate.photo}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <div className="p-2 bg-green-500 rounded-full shadow-lg">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">{candidate.name}</h2>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-4 h-4" />
                      <span>{candidate.location}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">{candidate.bio}</p>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Code className="w-5 h-5" />
                      <span className="font-semibold">Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



