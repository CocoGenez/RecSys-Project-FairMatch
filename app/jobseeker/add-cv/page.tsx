'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, User, Plus, X } from 'lucide-react'

interface UserProfile {
  id: number | null
  name: string
  surname: string
  email: string
  phone: string
  address: string
  gender: string
  interested_domain: string
  description: string
  age: number | null
  projects: string[]
  future_career: string
  hard_skills: string[]
  python_level: string
  sql_level: string
  java_level: string
  soft_skills: string[]
  languages: string[]
  education: string[]
  work_experience: string[]
  certifications: string[]
  interests: string[]
}

export default function ModifyProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<UserProfile>({
    id: null,
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    interested_domain: '',
    description: '',
    age: null,
    projects: [],
    future_career: '',
    hard_skills: [],
    python_level: 'Weak',
    sql_level: 'Weak',
    java_level: 'Weak',
    soft_skills: [],
    languages: [],
    education: [],
    work_experience: [],
    certifications: [],
    interests: [],
  })

  // États pour les champs d'ajout
  const [currentProject, setCurrentProject] = useState('')
  const [currentHardSkill, setCurrentHardSkill] = useState('')
  const [currentSoftSkill, setCurrentSoftSkill] = useState('')
  const [currentLanguage, setCurrentLanguage] = useState('')
  const [currentEducation, setCurrentEducation] = useState('')
  const [currentWorkExp, setCurrentWorkExp] = useState('')
  const [currentCertification, setCurrentCertification] = useState('')
  const [currentInterest, setCurrentInterest] = useState('')

  // Charger les données depuis la BDD
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user || !user.email || user.role !== 'jobseeker') {
        router.push('/login')
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`http://localhost:8000/api/user-profile-by-email/${encodeURIComponent(user.email)}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du profil')
        }

        const profileData = await response.json()
        
        // Pré-remplir le formulaire avec les données de la BDD
        setFormData({
          id: profileData.id,
          name: profileData.name || '',
          surname: profileData.surname || '',
          email: profileData.email || user.email,
          phone: profileData.phone || '',
          address: profileData.address || '',
          gender: profileData.gender || '',
          interested_domain: profileData.interested_domain || '',
          description: profileData.description || '',
          age: profileData.age || null,
          projects: profileData.projects || [],
          future_career: profileData.future_career || '',
          hard_skills: profileData.hard_skills || [],
          python_level: profileData.python_level || 'Weak',
          sql_level: profileData.sql_level || 'Weak',
          java_level: profileData.java_level || 'Weak',
          soft_skills: profileData.soft_skills || [],
          languages: profileData.languages || [],
          education: profileData.education || [],
          work_experience: profileData.work_experience || [],
          certifications: profileData.certifications || [],
          interests: profileData.interests || [],
        })
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err)
        // Si l'utilisateur n'existe pas encore, on garde les valeurs par défaut
        setFormData(prev => ({ ...prev, email: user.email }))
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [user, router])

  // Fonctions pour ajouter/supprimer des éléments
  const addToList = (listName: keyof UserProfile, value: string, setter: (v: string) => void) => {
    if (value.trim() && !(formData[listName] as string[]).includes(value.trim())) {
      setFormData({
        ...formData,
        [listName]: [...(formData[listName] as string[]), value.trim()],
      })
      setter('')
    }
  }

  const removeFromList = (listName: keyof UserProfile, value: string) => {
    setFormData({
      ...formData,
      [listName]: (formData[listName] as string[]).filter(item => item !== value),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const profileData = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        interested_domain: formData.interested_domain,
        description: formData.description,
        age: formData.age,
        projects: formData.projects,
        future_career: formData.future_career,
        hard_skills: formData.hard_skills,
        python_level: formData.python_level,
        sql_level: formData.sql_level,
        java_level: formData.java_level,
        soft_skills: formData.soft_skills,
        languages: formData.languages,
        education: formData.education,
        work_experience: formData.work_experience,
        certifications: formData.certifications,
        interests: formData.interests,
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
      
      // Rediriger vers la page swipe ou afficher un message de succès
      router.push('/jobseeker/swipe')
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const ListSection = ({ 
    title, 
    items, 
    currentValue, 
    setCurrentValue, 
    onAdd, 
    onRemove,
    placeholder 
  }: {
    title: string
    items: string[]
    currentValue: string
    setCurrentValue: (v: string) => void
    onAdd: () => void
    onRemove: (item: string) => void
    placeholder: string
  }) => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
          placeholder={placeholder}
        />
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdd}
          className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200"
            >
              <span className="text-gray-700">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Modifier mon profil
          </h1>
        </motion.div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de famille</label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <input
                  type="text"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domaine d&apos;intérêt</label>
                <input
                  type="text"
                  value={formData.interested_domain}
                  onChange={(e) => setFormData({ ...formData, interested_domain: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Âge</label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="Description professionnelle..."
                />
              </div>
            </div>
          </motion.div>

          {/* Carrière souhaitée */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Carrière souhaitée</h2>
            <select
              value={formData.future_career}
              onChange={(e) => setFormData({ ...formData, future_career: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
            >
              <option value="">Sélectionner une carrière</option>
              <option value="Machine Learning Researcher">Machine Learning Researcher</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Web Developer">Web Developer</option>
              <option value="Information Security Analyst">Information Security Analyst</option>
              <option value="Database Administrator">Database Administrator</option>
              <option value="Game Developer">Game Developer</option>
              <option value="AI Engineer">AI Engineer</option>
              <option value="Network Security Engineer">Network Security Engineer</option>
            </select>
          </motion.div>

          {/* Compétences techniques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Compétences techniques</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Python</label>
                  <select
                    value={formData.python_level}
                    onChange={(e) => setFormData({ ...formData, python_level: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="Weak">Weak</option>
                    <option value="Average">Average</option>
                    <option value="Strong">Strong</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SQL</label>
                  <select
                    value={formData.sql_level}
                    onChange={(e) => setFormData({ ...formData, sql_level: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="Weak">Weak</option>
                    <option value="Average">Average</option>
                    <option value="Strong">Strong</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Java</label>
                  <select
                    value={formData.java_level}
                    onChange={(e) => setFormData({ ...formData, java_level: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="Weak">Weak</option>
                    <option value="Average">Average</option>
                    <option value="Strong">Strong</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hard Skills</label>
                <ListSection
                  title=""
                  items={formData.hard_skills}
                  currentValue={currentHardSkill}
                  setCurrentValue={setCurrentHardSkill}
                  onAdd={() => addToList('hard_skills', currentHardSkill, setCurrentHardSkill)}
                  onRemove={(item) => removeFromList('hard_skills', item)}
                  placeholder="Ajouter une compétence technique (ex: Docker, AWS, React...)"
                />
              </div>
            </div>
          </motion.div>

          {/* Soft Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Compétences comportementales</h2>
            <ListSection
              title=""
              items={formData.soft_skills}
              currentValue={currentSoftSkill}
              setCurrentValue={setCurrentSoftSkill}
              onAdd={() => addToList('soft_skills', currentSoftSkill, setCurrentSoftSkill)}
              onRemove={(item) => removeFromList('soft_skills', item)}
              placeholder="Ajouter une compétence comportementale (ex: Leadership, Communication...)"
            />
          </motion.div>

          {/* Langues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Langues</h2>
            <ListSection
              title=""
              items={formData.languages}
              currentValue={currentLanguage}
              setCurrentValue={setCurrentLanguage}
              onAdd={() => addToList('languages', currentLanguage, setCurrentLanguage)}
              onRemove={(item) => removeFromList('languages', item)}
              placeholder="Ajouter une langue avec niveau (ex: Français: Natif, Anglais: B2)"
            />
          </motion.div>

          {/* Projets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Projets</h2>
            <ListSection
              title=""
              items={formData.projects}
              currentValue={currentProject}
              setCurrentValue={setCurrentProject}
              onAdd={() => addToList('projects', currentProject, setCurrentProject)}
              onRemove={(item) => removeFromList('projects', item)}
              placeholder="Ajouter un projet..."
            />
          </motion.div>

          {/* Formation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Formation</h2>
            <ListSection
              title=""
              items={formData.education}
              currentValue={currentEducation}
              setCurrentValue={setCurrentEducation}
              onAdd={() => addToList('education', currentEducation, setCurrentEducation)}
              onRemove={(item) => removeFromList('education', item)}
              placeholder="Ajouter une formation..."
            />
          </motion.div>

          {/* Expérience professionnelle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Expérience professionnelle</h2>
            <ListSection
              title=""
              items={formData.work_experience}
              currentValue={currentWorkExp}
              setCurrentValue={setCurrentWorkExp}
              onAdd={() => addToList('work_experience', currentWorkExp, setCurrentWorkExp)}
              onRemove={(item) => removeFromList('work_experience', item)}
              placeholder="Ajouter une expérience professionnelle..."
            />
          </motion.div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Certifications</h2>
            <ListSection
              title=""
              items={formData.certifications}
              currentValue={currentCertification}
              setCurrentValue={setCurrentCertification}
              onAdd={() => addToList('certifications', currentCertification, setCurrentCertification)}
              onRemove={(item) => removeFromList('certifications', item)}
              placeholder="Ajouter une certification..."
            />
          </motion.div>

          {/* Intérêts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Intérêts / Hobbies</h2>
            <ListSection
              title=""
              items={formData.interests}
              currentValue={currentInterest}
              setCurrentValue={setCurrentInterest}
              onAdd={() => addToList('interests', currentInterest, setCurrentInterest)}
              onRemove={(item) => removeFromList('interests', item)}
              placeholder="Ajouter un intérêt ou hobby..."
            />
          </motion.div>

          {/* Bouton de sauvegarde */}
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              'Sauvegarde en cours...'
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder les modifications
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
