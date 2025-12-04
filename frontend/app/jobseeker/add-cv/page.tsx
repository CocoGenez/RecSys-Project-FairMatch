'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, FileText, User, Plus, X } from 'lucide-react'
import { createCandidate, getCandidateByUserId } from '@/lib/backend'
import { getUserProfile } from '@/lib/api'
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
    age: '',
    gender: '',
    futureCareer: '',
    skills: [] as string[],
    projects: [] as string[],
    cvPdfUrl: '',
  })
  const [currentSkill, setCurrentSkill] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        // 1. Try loading from backend (Registration data)
        try {
          // The user.id is already the database ID
          if (user.id) {
            const profile = await getUserProfile(parseInt(user.id));
            console.log("Loaded profile from backend:", profile);
            
            // Map backend profile to form data
            const names = (profile.name || '').split(' ');
            const firstName = names[0] || '';
            const lastName = names.slice(1).join(' ') || '';
            
            setFormData(prev => ({
              ...prev,
              firstName: firstName || prev.firstName,
              lastName: lastName || prev.lastName,
              email: profile.email || prev.email,
              bio: profile.interested_domain ? `Interested in: ${profile.interested_domain}` : prev.bio,
              age: profile.age ? profile.age.toString() : prev.age,
              gender: profile.gender || prev.gender,
              futureCareer: profile.future_career || prev.futureCareer,
              skills: [
                profile.python_level ? `Python (${profile.python_level})` : null,
                profile.sql_level ? `SQL (${profile.sql_level})` : null,
                profile.java_level ? `Java (${profile.java_level})` : null
              ].filter(Boolean) as string[],
              projects: profile.projects || prev.projects,
            }));
          }
        } catch (e) {
          console.error("Failed to load backend profile", e);
        }

        // 2. Load from local storage (Existing candidate data)
        const existingCandidate = getCandidateByUserId(user.id)
        if (existingCandidate) {
          setFormData(prev => ({
            ...prev,
            firstName: existingCandidate.firstName || prev.firstName,
            lastName: existingCandidate.lastName || prev.lastName,
            email: existingCandidate.email || prev.email,
            photo: existingCandidate.photo || prev.photo,
            location: existingCandidate.location || prev.location,
            bio: existingCandidate.bio || prev.bio,
            skills: existingCandidate.skills && existingCandidate.skills.length > 0 ? existingCandidate.skills : prev.skills,
            cvPdfUrl: existingCandidate.cvPdfUrl || prev.cvPdfUrl,
          }))
          if (existingCandidate.cvType) {
            setCvType(existingCandidate.cvType)
          }
        }
      }
    }
    loadData();
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
      // We need to adapt the data to match what the backend expects for a Candidate
      // Since we modified the form to be simpler, we might need to map 'projects' to 'experiences' 
      // or just store them in bio/description if the backend Candidate model doesn't support raw projects list yet.
      // However, looking at the Candidate type, it has cvFormData which has experiences.
      // We can map projects to experiences for now to ensure they are saved.
      
      const mappedExperiences: Experience[] = formData.projects.map((proj, index) => ({
        id: index.toString(),
        position: 'Project',
        company: 'Personal/Academic',
        startDate: '',
        current: false,
        description: proj
      }));

      const candidateData: Omit<Candidate, 'id' | 'createdAt'> = {
        userId: user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        photo: formData.photo || undefined,
        location: formData.location || 'Non spécifié',
        bio: formData.bio || '',
        skills: formData.skills,
        qualities: [], // Removed from form
        cvType,
        cvPdfUrl: cvType === 'pdf' ? formData.cvPdfUrl : undefined,
        cvFormData: cvType === 'form' ? {
          experiences: mappedExperiences,
          education: [],
          languages: undefined,
          certifications: undefined,
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
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  Localisation
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">En développement</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  placeholder="Ex: Paris, France"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="text"
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
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrière visée
                </label>
                <input
                  type="text"
                  value={formData.futureCareer}
                  onChange={(e) => setFormData({ ...formData, futureCareer: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  Photo
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">En développement</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
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
                À propos / Domaine d'intérêt
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
              {/* Compétences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-50 rounded-3xl shadow-xl p-6 border border-gray-200 opacity-60"
              >
                <h2 className="text-xl font-bold text-gray-400 mb-2 flex items-center gap-2">
                  Compétences
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-normal">En développement</span>
                </h2>
                <p className="text-sm text-gray-500 mb-4">Les compétences sont remplies automatiquement à partir de votre CV.</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentSkill}
                        disabled
                        className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        placeholder="Ajoutez une compétence..."
                      />
                      <motion.button
                        type="button"
                        disabled
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
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
                </div>
              </motion.div>

              {/* Projets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Projets</h2>
                <div className="space-y-2">
                  {formData.projects.map((project, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={project}
                        onChange={(e) => {
                           const newProjects = [...formData.projects];
                           newProjects[index] = e.target.value;
                           setFormData({ ...formData, projects: newProjects });
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                           const newProjects = formData.projects.filter((_, i) => i !== index);
                           setFormData({ ...formData, projects: newProjects });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                   <button
                    type="button"
                    onClick={() => setFormData({ ...formData, projects: [...formData.projects, ''] })}
                    className="mt-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-purple-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un projet
                  </button>
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
              {loading ? 'Création...' : 'Enregistrer mon profil'}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}


