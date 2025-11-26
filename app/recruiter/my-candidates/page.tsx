'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart } from 'lucide-react'
import CVModal from '@/components/modals/CVModal'
import { getCandidates } from '@/lib/backend'
import { getLikedItems } from '@/lib/backend'
import { Candidate } from '@/lib/types'

export default function MyCandidatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isCVModalOpen, setIsCVModalOpen] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      router.push('/')
      return
    }

    const likedIds = getLikedItems(user.id, 'candidate')
    const allCandidates = getCandidates()
    const likedCandidates = allCandidates.filter(c => likedIds.includes(c.id))
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
            onClick={() => router.push('/recruiter/swipe')}
            className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Mes candidats retenus
          </h1>
        </motion.div>

        {candidates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun candidat retenu</h2>
            <p className="text-gray-600 mb-6">
              Commencez à swiper pour trouver des candidats qui vous intéressent !
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/recruiter/swipe')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
            >
              Commencer à swiper
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => {
                  setSelectedCandidate(candidate)
                  setIsCVModalOpen(true)
                }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-purple-100 cursor-pointer max-w-sm mx-auto w-full"
              >
                {/* Photo - plus petite */}
                <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center pt-8">
                  {candidate.photo ? (
                    <img
                      src={candidate.photo}
                      alt={`${candidate.firstName} ${candidate.lastName}`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
                      {candidate.firstName[0]}{candidate.lastName[0]}
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="p-2 bg-green-500 rounded-full shadow-lg">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
                
                {/* Informations essentielles */}
                <div className="p-6 flex flex-col">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                      {candidate.firstName} {candidate.lastName}
                    </h2>
                    <p className="text-gray-600 text-sm">{candidate.location}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Compétences</h3>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          +{candidate.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Qualités</h3>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {candidate.qualities.slice(0, 3).map((quality, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {quality}
                        </span>
                      ))}
                      {candidate.qualities.length > 3 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          +{candidate.qualities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CVModal
        candidate={selectedCandidate}
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
      />
    </div>
  )
}


