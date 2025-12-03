'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, FileText, Calendar, Target, Briefcase } from 'lucide-react'
import { JobOffer } from '@/lib/types'

interface JobModalProps {
  job: JobOffer | null
  isOpen: boolean
  onClose: () => void
}

export default function JobModal({ job, isOpen, onClose }: JobModalProps) {
  if (!job) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-8 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{job.title}</h2>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    <span className="font-semibold">{job.company}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/80 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-purple-900 mb-2">Job Details</h3>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li><span className="font-medium">Role:</span> {job.role || 'Not specified'}</li>
                    <li><span className="font-medium">Type:</span> {job.workType || 'Not specified'}</li>
                    <li><span className="font-medium">Experience:</span> {job.experience || 'Not specified'}</li>
                    <li><span className="font-medium">Salary:</span> {job.salaryRange || 'Not specified'}</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-900 mb-2">Company</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li><span className="font-medium">Size:</span> {job.companyBucket || 'Not specified'}</li>
                    <li><span className="font-medium">Sector:</span> {job.companyProfile?.Sector || 'Not specified'}</li>
                    <li><span className="font-medium">Industry:</span> {job.companyProfile?.Industry || 'Not specified'}</li>
                    <li><span className="font-medium">Location:</span> {job.location} {job.country ? `(${job.country})` : ''}</li>
                  </ul>
                </div>
              </div>

              {/* Job Description (formerly Objectives) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Job Description</h3>
                </div>
                <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{job.objectives}</p>
              </div>

              {/* Skills & Qualities */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Skills & Qualities</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...(job.skills || []), ...(job.requiredQualities || [])])).map((skill, idx) => (
                    <span key={`skill-${idx}`} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium border border-purple-200">
                      {skill}
                    </span>
                  ))}
                  {(!job.skills?.length && !job.requiredQualities?.length) && (
                    <span className="text-gray-500">No skills specified</span>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div>
                 <h3 className="text-lg font-bold text-gray-800 mb-2">Benefits</h3>
                 <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{job.benefits || 'Not specified'}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

