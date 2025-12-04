'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Candidate } from '@/lib/types'
import { X, Heart } from 'lucide-react'

interface FlipCardProps {
  candidate: Candidate
  onSwipe: (direction: 'left' | 'right') => void
  index: number
  onViewCV: (candidate: Candidate) => void
}

export default function FlipCard({ candidate, onSwipe, index, onViewCV }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100
    if (Math.abs(info.offset.x) > threshold) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left')
    } else {
      // Reset position
      x.set(0)
    }
    // Reset isDragging after short delay
    setTimeout(() => setIsDragging(false), 100)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isDragging && Math.abs(x.get()) < 10) {
      onViewCV(candidate)
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
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      initial={{ scale: 0.9, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute w-full max-w-sm h-[600px] cursor-grab active:cursor-grabbing"
      onClick={handleCardClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl h-full overflow-hidden border-2 border-gray-100 flex flex-col">
        <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center pt-8">
          {candidate.photo ? (
            <img
              src={candidate.photo}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
          )}
        </div>
        
        <div className="flex-1 p-6 flex flex-col">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <p className="text-gray-600 text-sm">{candidate.location}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Skills</h3>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {candidate.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 3 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  +{candidate.skills.length - 3}
                </span>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Qualities</h3>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {candidate.qualities.slice(0, 3).map((quality, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  {quality}
                </span>
              ))}
              {candidate.qualities.length > 3 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  +{candidate.qualities.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute top-4 left-4 p-3 bg-red-500 rounded-full shadow-lg z-10"
        style={{
          opacity: useTransform(x, [-100, -50], [1, 0]),
          scale: useTransform(x, [-100, -50], [1, 0])
        }}
      >
        <X className="w-6 h-6 text-white" />
      </motion.div>
      <motion.div
        className="absolute top-4 right-4 p-3 bg-green-500 rounded-full shadow-lg z-10"
        style={{
          opacity: useTransform(x, [50, 100], [0, 1]),
          scale: useTransform(x, [50, 100], [0, 1])
        }}
      >
        <Heart className="w-6 h-6 text-white" />
      </motion.div>
    </motion.div>
  )
}


