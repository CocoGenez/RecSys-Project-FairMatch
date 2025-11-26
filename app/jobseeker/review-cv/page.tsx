'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Save, Edit, ArrowRight, Plus, X } from 'lucide-react'

interface ParsedData {
  // Informations personnelles
  name?: string
  surname?: string
  Email?: string
  phone?: string
  Address?: string
  gender?: string
  interested_domain?: string
  
  // Informations de base
  Age?: number
  description?: string
  
  // Projets et carrière
  Projects?: string[]
  Future_Career?: string
  
  // Compétences
  Hard_Skills?: string[]
  Python_Level?: string
  SQL_Level?: string
  Java_Level?: string
  Soft_Skills?: string[]
  
  // Langues
  Languages?: string[]
  
  // Formation et expérience
  Education?: string[]
  Work_Experience?: string[]
  
  // Certifications et intérêts
  Certifications?: string[]
  Interests?: string[]
}

export default function ReviewCVPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [formData, setFormData] = useState({
    // Informations personnelles
    surname: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    
    // Informations de base
    age: '',
    
    // Projets et carrière
    projects: [] as string[],
    futureCareer: '',
    
    // Compétences
    hardSkills: [] as string[],
    pythonLevel: '',
    sqlLevel: '',
    javaLevel: '',
    softSkills: [] as string[],
    
    // Langues
    languages: [] as string[],
    
    // Formation et expérience
    education: [] as string[],
    workExperience: [] as string[],
    
    // Certifications et intérêts
    certifications: [] as string[],
    interests: [] as string[],
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
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'jobseeker') {
      router.push('/login')
      return
    }

    // Récupérer les données du sessionStorage
    const storedData = sessionStorage.getItem('parsedCVData')
    if (!storedData) {
      router.push('/jobseeker/upload-cv')
      return
    }

    const data: ParsedData = JSON.parse(storedData)
    setParsedData(data)
    
    // Fonction helper pour convertir les strings séparées par "/" en array
    const parseList = (value: string | string[] | undefined): string[] => {
      if (!value) return []
      if (Array.isArray(value)) return value
      if (typeof value === 'string') {
        return value.split('/').map(s => s.trim()).filter(s => s.length > 0)
      }
      return []
    }
    
    setFormData({
      surname: data.surname || '',
      email: data.Email || '',
      phone: data.phone || '',
      address: data.Address || '',
      description: data.description || '',
      age: data.Age?.toString() || '22',
      projects: parseList(data.Projects),
      futureCareer: data.Future_Career || '',
      hardSkills: parseList(data.Hard_Skills),
      pythonLevel: data.Python_Level || 'Weak',
      sqlLevel: data.SQL_Level || 'Weak',
      javaLevel: data.Java_Level || 'Weak',
      softSkills: parseList(data.Soft_Skills),
      languages: parseList(data.Languages),
      education: parseList(data.Education),
      workExperience: parseList(data.Work_Experience),
      certifications: parseList(data.Certifications),
      interests: parseList(data.Interests),
    })
  }, [user, router])

  // Fonctions pour ajouter/supprimer des éléments
  const addToList = (listName: keyof typeof formData, value: string, setter: (v: string) => void) => {
    if (value.trim() && !(formData[listName] as string[]).includes(value.trim())) {
      setFormData({
        ...formData,
        [listName]: [...(formData[listName] as string[]), value.trim()],
      })
      setter('')
    }
  }

  const removeFromList = (listName: keyof typeof formData, value: string) => {
    setFormData({
      ...formData,
      [listName]: (formData[listName] as string[]).filter(item => item !== value),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Préparer les données à envoyer
      const profileData = {
        name: parsedData?.name || '',
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: parsedData?.gender || '',
        interested_domain: parsedData?.interested_domain || '',
        description: formData.description,
        age: parseInt(formData.age) || 22,
        projects: formData.projects,
        future_career: formData.futureCareer,
        hard_skills: formData.hardSkills,
        python_level: formData.pythonLevel,
        sql_level: formData.sqlLevel,
        java_level: formData.javaLevel,
        soft_skills: formData.softSkills,
        languages: formData.languages,
        education: formData.education,
        work_experience: formData.workExperience,
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
      
      // Nettoyer le sessionStorage et rediriger
      sessionStorage.removeItem('parsedCVData')
      router.push('/jobseeker/swipe')
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!parsedData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
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

  return (
    <div className="min-h-screen p-4 pb-24 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
            <Edit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Vérifiez vos informations
          </h1>
          <p className="text-gray-600">
            Nous avons extrait ces informations de votre CV. Vous pouvez les modifier si nécessaire.
          </p>
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
                  value={parsedData.name || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Âge</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <input
                  type="text"
                  value={parsedData.gender || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domaine d&apos;intérêt</label>
                <input
                  type="text"
                  value={parsedData.interested_domain || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50"
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
              value={formData.futureCareer}
              onChange={(e) => setFormData({ ...formData, futureCareer: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
            >
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
                    value={formData.pythonLevel}
                    onChange={(e) => setFormData({ ...formData, pythonLevel: e.target.value })}
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
                    value={formData.sqlLevel}
                    onChange={(e) => setFormData({ ...formData, sqlLevel: e.target.value })}
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
                    value={formData.javaLevel}
                    onChange={(e) => setFormData({ ...formData, javaLevel: e.target.value })}
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
                  items={formData.hardSkills}
                  currentValue={currentHardSkill}
                  setCurrentValue={setCurrentHardSkill}
                  onAdd={() => addToList('hardSkills', currentHardSkill, setCurrentHardSkill)}
                  onRemove={(item) => removeFromList('hardSkills', item)}
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
              items={formData.softSkills}
              currentValue={currentSoftSkill}
              setCurrentValue={setCurrentSoftSkill}
              onAdd={() => addToList('softSkills', currentSoftSkill, setCurrentSoftSkill)}
              onRemove={(item) => removeFromList('softSkills', item)}
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
              items={formData.workExperience}
              currentValue={currentWorkExp}
              setCurrentValue={setCurrentWorkExp}
              onAdd={() => addToList('workExperience', currentWorkExp, setCurrentWorkExp)}
              onRemove={(item) => removeFromList('workExperience', item)}
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

          {/* Bouton de validation */}
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
                Sauvegarder et continuer
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
