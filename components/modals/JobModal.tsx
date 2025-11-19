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
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>Début: {new Date(job.startDate).toLocaleDateString('fr-FR')}</span>
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
              {/* Objectifs */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Objectifs de la mission</h3>
                </div>
                <p className="text-gray-700 leading-relaxed bg-blue-50 rounded-xl p-4">{job.objectives}</p>
              </div>

              {/* Qualités requises */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Qualités requises</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredQualities && job.requiredQualities.length > 0 ? (
                    job.requiredQualities.map((quality, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full font-medium"
                      >
                        {quality}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">Aucune qualité spécifiée</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Description du poste</h3>
                {job.descriptionType === 'text' && job.description && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                  </div>
                )}
                {job.descriptionType === 'document' && job.documentUrl && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-800">{job.documentName || 'Document'}</p>
                        <p className="text-sm text-gray-600">Document joint</p>
                      </div>
                    </div>
                    <motion.a
                      href={job.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg"
                    >
                      <FileText className="w-5 h-5" />
                      Voir le document
                    </motion.a>
                  </div>
                )}
                {job.descriptionType === 'link' && job.externalLink && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <ExternalLink className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-800">Lien externe</p>
                        <p className="text-sm text-gray-600 break-all">{job.externalLink}</p>
                      </div>
                    </div>
                    <motion.a
                      href={job.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Ouvrir le lien
                    </motion.a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

