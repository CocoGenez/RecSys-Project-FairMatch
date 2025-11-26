'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, User, Plus, X } from 'lucide-react'
import { Experience, Education, Language } from '@/lib/types'

export default function ReviewCVManualPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    photo: '',
    location: '',
    bio: '',
    skills: [] as string[],
    qualities: [] as string[],
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

    if (formData.skills.length === 0) {
      setError('Veuillez ajouter au moins une compétence')
      return
    }

    setLoading(true)

    try {
      // Convertir les expériences en liste de strings
      const workExperienceStrings = formData.experiences.map(exp => {
        const dates = exp.current 
          ? `${exp.startDate} - En cours`
          : `${exp.startDate} - ${exp.endDate || 'N/A'}`
        return `${exp.position} chez ${exp.company} (${dates}): ${exp.description || ''}`
      })

      // Convertir les formations en liste de strings
      const educationStrings = formData.education.map(edu => {
        const dates = edu.current
          ? `${edu.startDate} - En cours`
          : `${edu.startDate} - ${edu.endDate || 'N/A'}`
        return `${edu.degree} en ${edu.field} à ${edu.school} (${dates})`
      })

      // Convertir les langues en liste de strings avec niveau
      const languagesStrings = formData.languages.map(lang => {
        const levelMap: Record<string, string> = {
          'beginner': 'Débutant',
          'intermediate': 'Intermédiaire',
          'advanced': 'Avancé',
          'fluent': 'Courant',
          'native': 'Natif'
        }
        return `${lang.language}: ${levelMap[lang.level] || lang.level}`
      })

      // Préparer les données pour la BDD PostgreSQL
      const profileData = {
        name: formData.firstName,
        surname: formData.lastName,
        email: formData.email || user.email, // Utiliser l'email de l'utilisateur connecté si non fourni
        phone: '', // Non disponible dans ce formulaire
        address: formData.location || '',
        gender: '', // Non disponible dans ce formulaire
        interested_domain: '', // Non disponible dans ce formulaire
        description: formData.bio || '',
        age: null, // Non disponible dans ce formulaire
        projects: [], // Non disponible dans ce formulaire
        future_career: '', // Non disponible dans ce formulaire
        hard_skills: formData.skills,
        python_level: 'Weak', // Par défaut
        sql_level: 'Weak', // Par défaut
        java_level: 'Weak', // Par défaut
        soft_skills: formData.qualities,
        languages: languagesStrings,
        education: educationStrings,
        work_experience: workExperienceStrings,
        certifications: formData.certifications,
        interests: [], // Non disponible dans ce formulaire
      }

      const response = await fetch('http://localhost:8000/api/save-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors de la sauvegarde')
      }

      const result = await response.json()
      
      // Rediriger vers la page swipe
      router.push('/jobseeker/swipe')
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Remplir mon profil
          </h1>
          <p className="text-gray-600">Complétez vos informations manuellement</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="john.doe@example.com"
                  required
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
                  placeholder="Paris, France"
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

          {/* Compétences et qualités */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Compétences et qualités</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compétences *
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
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Expériences professionnelles</h2>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addExperience}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </motion.button>
            </div>
            {formData.experiences.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune expérience ajoutée</p>
            ) : (
              <div className="space-y-4">
                {formData.experiences.map((exp) => (
                  <div key={exp.id} className="p-4 border-2 border-gray-200 rounded-xl relative">
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Entreprise"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Poste"
                        value={exp.position}
                        onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="month"
                        placeholder="Date de début"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="month"
                        placeholder="Date de fin"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        disabled={exp.current}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                      />
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Poste actuel</span>
                        </label>
                      </div>
                      <textarea
                        placeholder="Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                        rows={3}
                        className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Formations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Formations</h2>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addEducation}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </motion.button>
            </div>
            {formData.education.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune formation ajoutée</p>
            ) : (
              <div className="space-y-4">
                {formData.education.map((edu) => (
                  <div key={edu.id} className="p-4 border-2 border-gray-200 rounded-xl relative">
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="École/Université"
                        value={edu.school}
                        onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Diplôme"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Domaine d'études"
                        value={edu.field}
                        onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="month"
                        placeholder="Date de début"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="month"
                        placeholder="Date de fin"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                        disabled={edu.current}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                      />
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={edu.current}
                            onChange={(e) => updateEducation(edu.id, { current: e.target.checked, endDate: e.target.checked ? '' : edu.endDate })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">En cours</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Langues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Langues</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                placeholder="Langue..."
              />
              <select
                value={currentLanguageLevel}
                onChange={(e) => setCurrentLanguageLevel(e.target.value as any)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
                <option value="fluent">Courant</option>
                <option value="native">Natif</option>
              </select>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentLanguage.trim()) {
                    setFormData({
                      ...formData,
                      languages: [...formData.languages, { language: currentLanguage.trim(), level: currentLanguageLevel }],
                    })
                    setCurrentLanguage('')
                  }
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {lang.language} - {lang.level}
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        languages: formData.languages.filter((_, i) => i !== index),
                      })}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Certifications</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentCertification}
                onChange={(e) => setCurrentCertification(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (currentCertification.trim()) {
                      setFormData({
                        ...formData,
                        certifications: [...formData.certifications, currentCertification.trim()],
                      })
                      setCurrentCertification('')
                    }
                  }
                }}
                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                placeholder="Certification..."
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentCertification.trim()) {
                    setFormData({
                      ...formData,
                      certifications: [...formData.certifications, currentCertification.trim()],
                    })
                    setCurrentCertification('')
                  }
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
            {formData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    {cert}
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        certifications: formData.certifications.filter((_, i) => i !== index),
                      })}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Sauvegarde...'
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer et continuer
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}

