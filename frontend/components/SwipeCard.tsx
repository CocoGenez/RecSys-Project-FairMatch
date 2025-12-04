'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { X, Heart, MapPin, Briefcase, Code } from 'lucide-react'
import { Candidate, JobOffer } from '@/lib/data'

interface SwipeCardProps {
  candidate?: Candidate
  jobOffer?: JobOffer
  onSwipe: (direction: 'left' | 'right') => void
  index: number
}

export default function SwipeCard({ candidate, jobOffer, onSwipe, index }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100
    if (Math.abs(info.offset.x) > threshold) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left')
    }
  }

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        zIndex: 10 - index,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute w-full max-w-md h-[600px] cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-3xl shadow-2xl h-full overflow-hidden border-2 border-gray-100">
        {candidate ? (
          <div className="h-full flex flex-col">
            <div className="relative h-2/3 bg-gradient-to-br from-purple-400 to-pink-400">
              <img
                src={candidate.photo}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">{candidate.name}</h2>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span>{candidate.location}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{candidate.bio}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Code className="w-5 h-5" />
                  <span className="font-semibold">Skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : jobOffer ? (
          <div className="h-full flex flex-col">
            <div className="relative h-1/3 bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
              <div className="text-8xl">{jobOffer.logo || '💼'}</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{jobOffer.title}</h2>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <Briefcase className="w-4 h-4" />
                <span className="font-semibold">{jobOffer.company}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{jobOffer.location}</span>
                {jobOffer.salary && (
                  <span className="ml-auto text-purple-600 font-semibold">{jobOffer.salary}</span>
                )}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">{jobOffer.description}</p>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Code className="w-5 h-5" />
                  <span className="font-semibold">Required skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {jobOffer.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <motion.div
          className="absolute top-4 left-4 p-3 bg-red-500 rounded-full shadow-lg"
          style={{
            opacity: useTransform(x, [-100, -50], [1, 0]),
            scale: useTransform(x, [-100, -50], [1, 0])
          }}
        >
          <X className="w-6 h-6 text-white" />
        </motion.div>
        <motion.div
          className="absolute top-4 right-4 p-3 bg-green-500 rounded-full shadow-lg"
          style={{
            opacity: useTransform(x, [50, 100], [0, 1]),
            scale: useTransform(x, [50, 100], [0, 1])
          }}
        >
          <Heart className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    </motion.div>
  )
}

