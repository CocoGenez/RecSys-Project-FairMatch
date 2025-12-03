'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart } from 'lucide-react'
import JobModal from '@/components/modals/JobModal'
import { getJobs } from '@/lib/backend'
import { getLikedItems } from '@/lib/backend'
import { getLikedJobs } from '@/lib/api'
import { JobOffer } from '@/lib/types'

export default function MyJobsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobOffer[]>([])
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'jobseeker') {
      router.push('/')
      return
    }

    const fetchLikedJobs = async () => {
      // 1. Try fetching from backend
      try {
        if (user.id && !isNaN(parseInt(user.id))) {
          const backendJobs = await getLikedJobs(parseInt(user.id))
          if (backendJobs && Array.isArray(backendJobs)) {
             // Adapt backend data to frontend interface (similar to useRecommendations)
             const adaptedJobs: JobOffer[] = backendJobs.map((job: any) => {
               let companyProfile = null;
               try {
                 if (typeof job.company_profile === 'string') {
                   companyProfile = JSON.parse(job.company_profile);
                 } else {
                   companyProfile = job.company_profile;
                 }
               } catch (e) {
                 console.error("Error parsing company_profile", e);
               }

               let benefits = job.benefits;
               if (typeof benefits === 'string' && benefits.startsWith("{'") && benefits.endsWith("'}")) {
                 benefits = benefits.substring(2, benefits.length - 2);
               }

               return {
                 id: job.job_id.toString(),
                 recruiterId: '0', // Mock
                 title: job.title,
                 company: job.company,
                 location: job.location,
                 objectives: job.description, // Map description to objectives
                 startDate: 'Dès que possible',
                 requiredQualities: job.skills, // Fallback/Duplicate for display
                 descriptionType: 'text',
                 description: job.description,
                 createdAt: Date.now(),
                 requiredSkills: job.skills, // Backend returns list from split_skills
                 salary: job.salary_range,
                 logo: '💼',
                 role: job.role,
                 country: job.country,
                 experience: job.experience,
                 qualifications: job.qualifications,
                 workType: job.work_type,
                 companyBucket: job.company_bucket,
                 benefits: benefits,
                 companyProfile: companyProfile,
                 salaryRange: job.salary_range,
                 skills: job.skills,
               };
             })
             setJobs(adaptedJobs)
             return
          }
        }
      } catch (e) {
        console.error("Failed to fetch liked jobs from backend", e)
      }

      // 2. Fallback to local storage
      const likedIds = getLikedItems(user.id, 'job')
      const allJobs = getJobs()
      const likedJobs = allJobs.filter(j => likedIds.includes(j.id))
      setJobs(likedJobs)
    }

    fetchLikedJobs()
  }, [user, router])

  if (!user || user.role !== 'jobseeker') {
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
            onClick={() => router.push('/jobseeker/swipe')}
            className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            My saved jobs
          </h1>
        </motion.div>

        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No saved jobs</h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find jobs that interest you!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/jobseeker/swipe')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
            >
              Start swiping
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => {
                  setSelectedJob(job)
                  setIsJobModalOpen(true)
                }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-blue-100 cursor-pointer max-w-sm mx-auto w-full"
              >
                {/* Header with logo - smaller */}
                <div className="relative h-32 bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center pt-4">
                  <div className="text-6xl">💼</div>
                  <div className="absolute top-4 right-4">
                    <div className="p-2 bg-green-500 rounded-full shadow-lg">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
                
                {/* Essential Information */}
                <div className="p-6 flex flex-col">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{job.title}</h2>
                    <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                      <span className="font-semibold">{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Required Skills</h3>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {job.requiredQualities && job.requiredQualities.length > 0 ? (
                        <>
                          {job.requiredQualities.slice(0, 3).map((quality, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {quality}
                            </span>
                          ))}
                          {job.requiredQualities.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{job.requiredQualities.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">No skills specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <JobModal
        job={selectedJob}
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
      />
    </div>
  )
}

