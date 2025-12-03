'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, FileText, User, Plus, X } from 'lucide-react'
import { createCandidate, getCandidateByUserId } from '@/lib/backend'
import { Candidate, Experience, Education, Language } from '@/lib/types'

export default function AddCVPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [cvType, setCvType] = useState<'pdf' | 'form'>('form')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    photo: '',
    location: '',
    bio: '',
    skills: [] as string[],
    qualities: [] as string[],
    cvPdfUrl: '',
    experiences: [] as Experience[],
    education: [] as Education[],
    languages: [] as Language[],
    certifications: [] as string[],
  })
  const [currentSkill, setCurrentSkill] = useState('')
  const [currentQuality, setCurrentQuality] = useState('')
  const [currentLanguage, setCurrentLanguage] = useState('')
  const [currentLanguageLevel, setCurrentLanguageLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native'>('intermediate')
  const [currentCertification, setCurrentCertification] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      const existingCandidate = getCandidateByUserId(user.id)
      if (existingCandidate) {
        setFormData({
          firstName: existingCandidate.firstName,
          lastName: existingCandidate.lastName,
          email: existingCandidate.email,
          photo: existingCandidate.photo || '',
          location: existingCandidate.location || '',
          bio: existingCandidate.bio || '',
          skills: existingCandidate.skills || [],
          qualities: existingCandidate.qualities || [],
          cvPdfUrl: existingCandidate.cvPdfUrl || '',
          experiences: existingCandidate.cvFormData?.experiences || [],
          education: existingCandidate.cvFormData?.education || [],
          languages: existingCandidate.cvFormData?.languages || [],
          certifications: existingCandidate.cvFormData?.certifications || [],
        })
        if (existingCandidate.cvType) {
          setCvType(existingCandidate.cvType)
        }
      }
    }
  }, [user])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setFormData({ ...formData, cvPdfUrl: url })
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setFormData({ ...formData, photo: url })
      }
      reader.readAsDataURL(file)
    } else {
      alert('Veuillez sélectionner un fichier image (JPG, PNG, etc.)')
    }
  }

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      current: false,
    }
    setFormData({
      ...formData,
      experiences: [...formData.experiences, newExp],
    })
  }

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.map(exp =>
        exp.id === id ? { ...exp, ...updates } : exp
      ),
    })
  }

  const removeExperience = (id: string) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter(exp => exp.id !== id),
    })
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
    }
    setFormData({
      ...formData,
      education: [...formData.education, newEdu],
    })
  }

  const updateEducation = (id: string, updates: Partial<Education>) => {
    setFormData({
      ...formData,
      education: formData.education.map(edu =>
        edu.id === id ? { ...edu, ...updates } : edu
      ),
    })
  }

  const removeEducation = (id: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter(edu => edu.id !== id),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user || user.role !== 'jobseeker') {
      setError('Vous devez être connecté en tant que candidat')
      return
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Veuillez remplir les informations personnelles')
      return
    }

    if (cvType === 'pdf' && !formData.cvPdfUrl) {
      setError('Veuillez importer un CV PDF')
      return
    }

    if (cvType === 'form' && formData.skills.length === 0) {
      setError('Veuillez ajouter au moins une compétence')
      return
    }

    setLoading(true)

    try {
      const candidateData: Omit<Candidate, 'id' | 'createdAt'> = {
        userId: user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        photo: formData.photo || undefined,
        location: formData.location || 'Non spécifié',
        bio: formData.bio || '',
        skills: formData.skills,
        qualities: formData.qualities,
        cvType,
        cvPdfUrl: cvType === 'pdf' ? formData.cvPdfUrl : undefined,
        cvFormData: cvType === 'form' ? {
          experiences: formData.experiences,
          education: formData.education,
          languages: formData.languages.length > 0 ? formData.languages : undefined,
          certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
        } : undefined,
      }

      createCandidate(candidateData)
      router.push('/jobseeker/swipe')
    } catch (err) {
      setError('Une erreur est survenue lors de la création du profil')
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
            Ajouter mon CV
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Choix du type de CV */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Type de CV</h2>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCvType('pdf')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  cvType === 'pdf'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-semibold">Importer un PDF</p>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCvType('form')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  cvType === 'form'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <User className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-semibold">Remplir un formulaire</p>
              </motion.button>
            </div>
          </motion.div>

          {/* Informations personnelles - toujours affichées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Informations personnelles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="Ex: Paris, France"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
                {formData.photo && (
                  <div className="mt-3">
                    <img
                      src={formData.photo}
                      alt="Aperçu"
                      className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
                    />
                    <p className="text-xs text-green-600 mt-2">✓ Photo importée avec succès</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                À propos
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all resize-none"
                placeholder="Décrivez-vous en quelques lignes..."
              />
            </div>
          </motion.div>

          {cvType === 'pdf' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">Importer votre CV</h2>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
              />
              {formData.cvPdfUrl && (
                <p className="mt-4 text-green-600 font-semibold">✓ CV importé avec succès</p>
              )}
            </motion.div>
          ) : (
            <>
              {/* Compétences et qualités */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Compétences et qualités</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compétences
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
                              setFormData({
                                ...formData,
                                skills: [...formData.skills, currentSkill.trim()],
                              })
                              setCurrentSkill('')
                            }
                          }
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                        placeholder="Ajoutez une compétence..."
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
                            setFormData({
                              ...formData,
                              skills: [...formData.skills, currentSkill.trim()],
                            })
                            setCurrentSkill('')
                          }
                        }}
                        className="px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold"
                      >
                        <Plus className="w-5 h-5" />
                      </motion.button>
                    </div>
                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                skills: formData.skills.filter(s => s !== skill),
                              })}
                              className="hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualités
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentQuality}
                        onChange={(e) => setCurrentQuality(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (currentQuality.trim() && !formData.qualities.includes(currentQuality.trim())) {
                              setFormData({
                                ...formData,
                                qualities: [...formData.qualities, currentQuality.trim()],
                              })
                              setCurrentQuality('')
                            }
                          }
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                        placeholder="Ajoutez une qualité..."
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (currentQuality.trim() && !formData.qualities.includes(currentQuality.trim())) {
                            setFormData({
                              ...formData,
                              qualities: [...formData.qualities, currentQuality.trim()],
                            })
                            setCurrentQuality('')
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold"
                      >
                        <Plus className="w-5 h-5" />
                      </motion.button>
                    </div>
                    {formData.qualities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.qualities.map((quality) => (
                          <span
                            key={quality}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {quality}
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                qualities: formData.qualities.filter(q => q !== quality),
                              })}
                              className="hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Expériences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Expériences professionnelles</h2>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addExperience}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {formData.experiences.map((exp) => (
                    <div key={exp.id} className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Poste"
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Entreprise"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={exp.endDate || ''}
                            onChange={(e) => updateExperience(exp.id, { endDate: e.target.value, current: !e.target.value })}
                            disabled={exp.current}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => updateExperience(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
                            />
                            Actuel
                          </label>
                        </div>
                      </div>
                      <textarea
                        placeholder="Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Formation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Formation</h2>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addEducation}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {formData.education.map((edu) => (
                    <div key={edu.id} className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Diplôme"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="École/Université"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                        />
                        <textarea
                          placeholder="Description"
                          value={edu.field}
                          onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                          rows={2}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                          />
                          <input
                            type="date"
                            value={edu.endDate || ''}
                            onChange={(e) => updateEducation(edu.id, { endDate: e.target.value, current: !e.target.value })}
                            disabled={edu.current}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={edu.current}
                              onChange={(e) => updateEducation(edu.id, { current: e.target.checked, endDate: e.target.checked ? '' : edu.endDate })}
                            />
                            Actuel
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Langues et certifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Langues</h3>
                    <div className="space-y-2 mb-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentLanguage}
                          onChange={(e) => setCurrentLanguage(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                          placeholder="Ajouter une langue..."
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (currentLanguage.trim() && !formData.languages.some(l => l.name === currentLanguage.trim())) {
                              setFormData({
                                ...formData,
                                languages: [...formData.languages, {
                                  name: currentLanguage.trim(),
                                  level: currentLanguageLevel
                                }],
                              })
                              setCurrentLanguage('')
                              setCurrentLanguageLevel('intermediate')
                            }
                          }}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg flex-shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                      <select
                        value={currentLanguageLevel}
                        onChange={(e) => setCurrentLanguageLevel(e.target.value as Language['level'])}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none bg-white"
                      >
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                        <option value="fluent">Courant</option>
                        <option value="native">Natif</option>
                      </select>
                    </div>
                    {formData.languages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.languages.map((lang, idx) => {
                          const levelLabels: Record<Language['level'], string> = {
                            beginner: 'Débutant',
                            intermediate: 'Intermédiaire',
                            advanced: 'Avancé',
                            fluent: 'Courant',
                            native: 'Natif'
                          }
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                            >
                              {lang.name} <span className="text-xs text-green-600">({levelLabels[lang.level]})</span>
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  languages: formData.languages.filter((_, i) => i !== idx),
                                })}
                                className="hover:text-red-600 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Certifications</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentCertification}
                        onChange={(e) => setCurrentCertification(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (currentCertification.trim() && !formData.certifications.includes(currentCertification.trim())) {
                              setFormData({
                                ...formData,
                                certifications: [...formData.certifications, currentCertification.trim()],
                              })
                              setCurrentCertification('')
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none"
                        placeholder="Ajouter une certification..."
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (currentCertification.trim() && !formData.certifications.includes(currentCertification.trim())) {
                            setFormData({
                              ...formData,
                              certifications: [...formData.certifications, currentCertification.trim()],
                            })
                            setCurrentCertification('')
                          }
                        }}
                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                    {formData.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.certifications.map((cert) => (
                          <span
                            key={cert}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                          >
                            {cert}
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                certifications: formData.certifications.filter(c => c !== cert),
                              })}
                              className="hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}

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
            transition={{ delay: 0.5 }}
            className="flex gap-4"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Annuler
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Création...' : 'Créer mon profil'}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}


