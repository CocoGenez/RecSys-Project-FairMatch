'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download } from 'lucide-react'
import { Candidate } from '@/lib/types'

interface CVModalProps {
  candidate: Candidate | null
  isOpen: boolean
  onClose: () => void
}

export default function CVModal({ candidate, isOpen, onClose }: CVModalProps) {
  if (!candidate) return null

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
            className="fixed inset-4 md:inset-8 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  CV de {candidate.firstName} {candidate.lastName}
                </h2>
                <p className="text-gray-600">{candidate.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {candidate.cvType === 'pdf' && candidate.cvPdfUrl ? (
                <div className="h-full">
                  <iframe
                    src={candidate.cvPdfUrl}
                    className="w-full h-full min-h-[600px] rounded-xl border border-gray-200"
                    title="CV PDF"
                  />
                  <div className="mt-4 flex justify-center">
                    <motion.a
                      href={candidate.cvPdfUrl}
                      download
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger le CV
                    </motion.a>
                  </div>
                </div>
              ) : candidate.cvFormData ? (
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Informations personnelles */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Full name</p>
                        <p className="font-semibold text-gray-800">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-800">{candidate.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold text-gray-800">{candidate.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Qualités */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Qualities</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.qualities.map((quality, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium"
                        >
                          {quality}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expériences */}
                  {candidate.cvFormData.experiences.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Professional Experience</h3>
                      <div className="space-y-4">
                        {candidate.cvFormData.experiences.map((exp, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-semibold text-gray-600">Position : </span>
                                <span className="text-lg font-bold text-gray-800">{exp.position || 'Non spécifié'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-gray-600">Company : </span>
                                <span className="text-purple-600 font-semibold">{exp.company || 'Non spécifié'}</span>
                              </div>
                              {exp.description && (
                                <div>
                                  <span className="text-sm font-semibold text-gray-600">Missions : </span>
                                  <span className="text-gray-700">{exp.description}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-semibold text-gray-600">Period : </span>
                                <span className="text-gray-700">
                                  {exp.startDate || 'Non spécifié'} - {exp.endDate || (exp.current ? 'Présent' : 'Non spécifié')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formation */}
                  {candidate.cvFormData.education.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Education</h3>
                      <div className="space-y-4">
                        {candidate.cvFormData.education.map((edu, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-semibold text-gray-600">Degree : </span>
                                <span className="text-lg font-bold text-gray-800">{edu.degree || 'Non spécifié'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-gray-600">Institution : </span>
                                <span className="text-purple-600 font-semibold">{edu.school || 'Non spécifié'}</span>
                              </div>
                              {edu.field && (
                                <div>
                                  <span className="text-sm font-semibold text-gray-600">Description : </span>
                                  <span className="text-gray-700">{edu.field}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-semibold text-gray-600">Period : </span>
                                <span className="text-gray-700">
                                  {edu.startDate || 'Non spécifié'} - {edu.endDate || (edu.current ? 'Présent' : 'Non spécifié')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Langues */}
                  {candidate.cvFormData.languages && candidate.cvFormData.languages.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Langues</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.cvFormData.languages.map((lang, idx) => {
                          // Gérer les anciennes données (string) et les nouvelles (Language)
                          const languageName = typeof lang === 'string' ? lang : lang.name
                          const languageLevel = typeof lang === 'string' ? null : lang.level
                          
                          const levelLabels: Record<string, string> = {
                            beginner: 'Beginner',
                            intermediate: 'Intermediate',
                            advanced: 'Advanced',
                            fluent: 'Fluent',
                            native: 'Native'
                          }
                          
                          return (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium"
                            >
                              {languageName}
                              {languageLevel && (
                                <span className="ml-2 text-xs text-green-600">
                                  ({levelLabels[languageLevel]})
                                </span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {candidate.cvFormData.certifications && candidate.cvFormData.certifications.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.cvFormData.certifications.map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-medium"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {candidate.bio && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">About</h3>
                      <p className="text-gray-700 leading-relaxed">{candidate.bio}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No CV available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


