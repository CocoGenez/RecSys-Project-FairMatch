'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Save, Edit, ArrowRight } from 'lucide-react'

interface ParsedData {
  Age: number
  Projects: string[]
  Future_Career: string
  Python_Level: string
  SQL_Level: string
  Java_Level: string
  name: string
  gender: string
  interested_domain: string
  user_id: number
}

export default function ReviewCVPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [formData, setFormData] = useState({
    age: '',
    projects: [] as string[],
    futureCareer: '',
    pythonLevel: '',
    sqlLevel: '',
    javaLevel: '',
  })
  const [currentProject, setCurrentProject] = useState('')
  const [loading, setLoading] = useState(false)

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
    setFormData({
      age: data.Age?.toString() || '22',
      projects: data.Projects || [],
      futureCareer: data.Future_Career || '',
      pythonLevel: data.Python_Level || 'Weak',
      sqlLevel: data.SQL_Level || 'Weak',
      javaLevel: data.Java_Level || 'Weak',
    })
  }, [user, router])

  const handleAddProject = () => {
    if (currentProject.trim() && !formData.projects.includes(currentProject.trim())) {
      setFormData({
        ...formData,
        projects: [...formData.projects, currentProject.trim()],
      })
      setCurrentProject('')
    }
  }

  const handleRemoveProject = (project: string) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter(p => p !== project),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Les données sont déjà sauvegardées dans la DB par l'API
    // On nettoie le sessionStorage et on redirige vers swipe
    sessionStorage.removeItem('parsedCVData')
    
    // Vous pouvez optionnellement faire une mise à jour si l'utilisateur a modifié les données
    // TODO: Créer un endpoint PATCH pour mettre à jour le profil utilisateur
    
    setTimeout(() => {
      router.push('/jobseeker/swipe')
    }, 500)
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

  return (
    <div className="min-h-screen p-4 pb-24">
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
                  Nom
                </label>
                <input
                  type="text"
                  value={parsedData.name}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Âge
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <input
                  type="text"
                  value={parsedData.gender}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domaine d&apos;intérêt
                </label>
                <input
                  type="text"
                  value={parsedData.interested_domain}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Python
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SQL
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Java
                </label>
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
          </motion.div>

          {/* Projets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Projets</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentProject}
                  onChange={(e) => setCurrentProject(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddProject()
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="Ajouter un projet..."
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddProject}
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold"
                >
                  Ajouter
                </motion.button>
              </div>
              {formData.projects.length > 0 && (
                <div className="space-y-2">
                  {formData.projects.map((project, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200"
                    >
                      <span className="text-gray-700">{project}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(project)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                Continuer vers les offres
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}

