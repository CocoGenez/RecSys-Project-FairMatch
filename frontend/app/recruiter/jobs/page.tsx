'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus } from 'lucide-react'
import { getJobsByRecruiterId } from '@/lib/backend'
import { JobOffer } from '@/lib/types'

export default function RecruiterJobsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobOffer[]>([])

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      router.push('/')
      return
    }

    const recruiterJobs = getJobsByRecruiterId(user.id)
    setJobs(recruiterJobs)
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/recruiter/swipe')}
              className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mes offres d'emploi
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/recruiter/add-job')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter une offre
          </motion.button>
        </motion.div>

        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune offre créée</h2>
            <p className="text-gray-600 mb-6">
              Créez votre première offre d'emploi pour commencer à recruter !
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/recruiter/add-job')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
            >
              Créer une offre
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-blue-100"
              >
                <div className="relative h-32 bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                  <div className="text-6xl">💼</div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{job.title}</h2>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <span className="font-semibold">{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed line-clamp-2">{job.objectives}</p>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Qualités requises</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredQualities && job.requiredQualities.length > 0 ? (
                        <>
                          {job.requiredQualities.slice(0, 3).map((quality, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {quality}
                            </span>
                          ))}
                          {job.requiredQualities.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                              +{job.requiredQualities.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500 text-sm">Aucune qualité spécifiée</span>
                      )}
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

