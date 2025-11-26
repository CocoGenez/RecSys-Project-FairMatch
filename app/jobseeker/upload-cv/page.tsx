'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Upload, FileText, ArrowRight, Home } from 'lucide-react'

export default function UploadCVPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState({
    name: '',
    gender: '',
    interested_domain: ''
  })

  // Redirection si pas connecté ou pas jobseeker
  if (!user || user.role !== 'jobseeker') {
    router.push('/login')
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Veuillez sélectionner un fichier PDF')
      setFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('Veuillez sélectionner un CV')
      return
    }

    if (!additionalInfo.name || !additionalInfo.gender || !additionalInfo.interested_domain) {
      setError('Veuillez remplir toutes les informations')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', additionalInfo.name)
      formData.append('gender', additionalInfo.gender)
      formData.append('interested_domain', additionalInfo.interested_domain)

      const response = await fetch('http://localhost:8000/api/parse-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du parsing du CV')
      }

      const result = await response.json()

      // Stocker les données parsées dans sessionStorage pour la page suivante
      sessionStorage.setItem('parsedCVData', JSON.stringify({
        ...result.data,
        name: additionalInfo.name,
        gender: additionalInfo.gender,
        interested_domain: additionalInfo.interested_domain
      }))

      // Rediriger vers la page de review
      router.push('/jobseeker/review-cv')
    } catch (err) {
      setError('Une erreur est survenue lors du parsing du CV')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        title="Retour à l'accueil"
      >
        <Home className="w-5 h-5 text-purple-600" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Importez votre CV
            </h1>
            <p className="text-gray-600">Nous allons extraire vos informations automatiquement</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={additionalInfo.name}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre *
                </label>
                <select
                  value={additionalInfo.gender}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  <option value="Male">Homme</option>
                  <option value="Female">Femme</option>
                  <option value="Other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domaine d&apos;intérêt *
                </label>
                <select
                  value={additionalInfo.interested_domain}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, interested_domain: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Database Management">Database Management</option>
                  <option value="Game Development">Game Development</option>
                  <option value="AI Engineering">AI Engineering</option>
                  <option value="Network Security">Network Security</option>
                </select>
              </div>
            </motion.div>

            {/* Upload de CV */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV (PDF uniquement) *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                />
                <label
                  htmlFor="cv-upload"
                  className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition-all bg-gray-50 hover:bg-purple-50"
                >
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : 'Cliquez pour sélectionner votre CV'}
                    </p>
                  </div>
                </label>
              </div>
              {file && (
                <p className="mt-2 text-sm text-green-600 font-semibold">✓ {file.name} sélectionné</p>
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
              disabled={loading || !file}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Analyse en cours...'
              ) : (
                <>
                  Analyser mon CV
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OU</span>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/jobseeker/review-cv-manual')}
              className="w-full bg-white border-2 border-purple-500 text-purple-600 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Remplir manuellement à la place
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

