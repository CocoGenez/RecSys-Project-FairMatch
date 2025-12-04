'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, FileText, Link as LinkIcon, Type } from 'lucide-react'
import { createJob } from '@/lib/backend'
import { filterQualities, PREDEFINED_QUALITIES } from '@/lib/qualities'
import { JobOffer } from '@/lib/types'

export default function AddJobPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    objectives: '',
    startDate: '',
    requiredQualities: [] as string[],
    descriptionType: 'text' as 'text' | 'document' | 'link',
    description: '',
    documentUrl: '',
    documentName: '',
    externalLink: '',
  })
  const [qualitySearch, setQualitySearch] = useState('')
  const [showQualitySuggestions, setShowQualitySuggestions] = useState(false)
  const [customQuality, setCustomQuality] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredQualities = filterQualities(qualitySearch)

  const handleAddQuality = (quality: string) => {
    if (!formData.requiredQualities.includes(quality)) {
      setFormData({
        ...formData,
        requiredQualities: [...formData.requiredQualities, quality],
      })
    }
    setQualitySearch('')
    setShowQualitySuggestions(false)
  }

  const handleAddCustomQuality = () => {
    if (customQuality.trim() && !formData.requiredQualities.includes(customQuality.trim())) {
      setFormData({
        ...formData,
        requiredQualities: [...formData.requiredQualities, customQuality.trim()],
      })
      setCustomQuality('')
    }
  }

  const handleRemoveQuality = (quality: string) => {
    setFormData({
      ...formData,
      requiredQualities: formData.requiredQualities.filter(q => q !== quality),
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Simulate the upload
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setFormData({
          ...formData,
          documentUrl: url,
          documentName: file.name,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user || user.role !== 'recruiter') {
      setError('You must be logged in as a recruiter')
      return
    }

    if (!formData.title || !formData.objectives || !formData.startDate) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.requiredQualities.length === 0) {
      setError('Please add at least one required quality')
      return
    }

    setLoading(true)

    try {
      const jobData: Omit<JobOffer, 'id' | 'createdAt'> = {
        recruiterId: user.id,
        title: formData.title,
        company: formData.company || 'Company',
        location: formData.location || 'Not specified',
        objectives: formData.objectives,
        startDate: formData.startDate,
        requiredQualities: formData.requiredQualities,
        descriptionType: formData.descriptionType,
        description: formData.descriptionType === 'text' ? formData.description : undefined,
        documentUrl: formData.descriptionType === 'document' ? formData.documentUrl : undefined,
        documentName: formData.descriptionType === 'document' ? formData.documentName : undefined,
        externalLink: formData.descriptionType === 'link' ? formData.externalLink : undefined,
      }

      createJob(jobData)
      router.push('/recruiter/jobs')
    } catch (err) {
      setError('An error occurred while creating the offer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Add a job offer
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">General information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="Ex: Développeur Full-Stack React/Node.js"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                    placeholder="Ex: Paris, France"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mission objectives <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all resize-none"
                  placeholder="Décrivez les objectifs principaux de la mission..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired start date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Qualités requises */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Required qualities <span className="text-red-500">*</span></h2>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={qualitySearch}
                  onChange={(e) => {
                    setQualitySearch(e.target.value)
                    setShowQualitySuggestions(true)
                  }}
                  onFocus={() => setShowQualitySuggestions(true)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="Tapez pour filtrer les qualités..."
                />
                {showQualitySuggestions && filteredQualities.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-60 overflow-y-auto">
                    {filteredQualities.map((quality) => (
                      <button
                        key={quality}
                        type="button"
                        onClick={() => handleAddQuality(quality)}
                        className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors"
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customQuality}
                  onChange={(e) => setCustomQuality(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomQuality())}
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="Ou ajoutez une qualité personnalisée..."
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddCustomQuality}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold"
                >
                  Ajouter
                </motion.button>
              </div>

              {formData.requiredQualities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requiredQualities.map((quality) => (
                    <span
                      key={quality}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium"
                    >
                      {quality}
                      <button
                        type="button"
                        onClick={() => handleRemoveQuality(quality)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Description du poste */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Job description</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, descriptionType: 'text' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.descriptionType === 'text'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <Type className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-semibold">Text</p>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, descriptionType: 'document' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.descriptionType === 'document'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-semibold">Document</p>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, descriptionType: 'link' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.descriptionType === 'link'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <LinkIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-semibold">Link</p>
                </motion.button>
              </div>

              {formData.descriptionType === 'text' && (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all resize-none"
                  placeholder="Rédigez une description complète du poste..."
                />
              )}

              {formData.descriptionType === 'document' && (
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  />
                  {formData.documentName && (
                    <p className="mt-2 text-sm text-gray-600">Selected file: {formData.documentName}</p>
                  )}
                </div>
              )}

              {formData.descriptionType === 'link' && (
                <input
                  type="url"
                  value={formData.externalLink}
                  onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="https://..."
                />
              )}
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create Offer'}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}





