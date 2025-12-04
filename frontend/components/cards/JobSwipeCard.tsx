'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { X, Heart, Code, Briefcase, Zap, LineChart, Users, Palette, Server, Database, Smartphone, Cpu } from 'lucide-react'
import { JobOffer } from '@/lib/types'

interface JobSwipeCardProps {
  job: JobOffer
  onSwipe: (direction: 'left' | 'right') => void
  onJobClick: (job: JobOffer) => void
  index: number
}

// Function to get icon & gradient from job title
function getJobTheme(title: string) {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('ux') || lowerTitle.includes('ui') || lowerTitle.includes('designer')) {
    return {
      icon: Palette,
      gradient: 'from-pink-400 to-rose-500',
      bgColor: 'bg-gradient-to-br from-pink-400 to-rose-500'
    }
  }
  
  // Create an icon for each data roles
  if (lowerTitle.includes('data')) {
    // Data scientist
    if (lowerTitle.includes('scientist')) {
      return {
        icon: Cpu,
        gradient: 'from-violet-500 to-purple-600',
        bgColor: 'bg-gradient-to-br from-violet-500 to-purple-600'
      }
    }
    // Data engineer
    if (lowerTitle.includes('engineer')) {
      return {
        icon: Database,
        gradient: 'from-cyan-400 to-blue-500',
        bgColor: 'bg-gradient-to-br from-cyan-400 to-blue-500'
      }
    }
    // Data Analyst
    return {
      icon: LineChart,
      gradient: 'from-green-400 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-green-400 to-emerald-600'
    }
  }
  
  // Frontend/Backend/Web/Software Developer roles
  // Frontend
  if (lowerTitle.includes('front-end') || lowerTitle.includes('frontend')) {
    return {
      icon: Smartphone,
      gradient: 'from-teal-400 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-teal-400 to-cyan-500'
    }
  }
  // Backend
  if (lowerTitle.includes('back-end') || lowerTitle.includes('backend')) {
    return {
      icon: Server,
      gradient: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-indigo-500 to-blue-600'
    }
  }
  // Web Developer / Software Developer
  if (lowerTitle.includes('web developer') || lowerTitle.includes('software developer') || lowerTitle.includes('java developer')) {
    return {
      icon: Code,
      gradient: 'from-blue-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-500 to-purple-600'
    }
  }
  
  // Software Engineer
  if (lowerTitle.includes('software engineer')) {
    return {
      icon: Code,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    }
  }
  
  // Database Administrator
  if (lowerTitle.includes('database') || lowerTitle.includes('dba')) {
    return {
      icon: Database,
      gradient: 'from-cyan-400 to-blue-500',
      bgColor: 'bg-gradient-to-br from-cyan-400 to-blue-500'
    }
  }
  
  // Cybersecurity
  if (lowerTitle.includes('security') || lowerTitle.includes('network')) {
    return {
      icon: Zap,
      gradient: 'from-red-500 to-orange-600',
      bgColor: 'bg-gradient-to-br from-red-500 to-orange-600'
    }
  }
  
  // Default
  return {
    icon: Briefcase,
    gradient: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-gradient-to-br from-blue-400 to-cyan-400'
  }
}

export default function JobSwipeCard({ job, onSwipe, onJobClick, index }: JobSwipeCardProps) {
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
    setTimeout(() => setIsDragging(false), 100)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isDragging && Math.abs(x.get()) < 10) {
      onJobClick(job)
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
        {(() => {
          const theme = getJobTheme(job.title)
          const Icon = theme.icon
          return (
            <div className={`relative h-32 ${theme.bgColor} flex items-center justify-center pt-4`}>
              <Icon className="w-16 h-16 text-white opacity-90" />
            </div>
          )
        })()}
        
        <div className="flex-1 p-6 flex flex-col">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-1 line-clamp-2">{job.title}</h2>
            <p className="text-sm text-purple-600 font-medium mb-2">{job.role || 'Role not specified'}</p>
            
            <div className="flex flex-col gap-1 text-gray-600 text-sm mb-3">
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold">{job.company}</span>
                <span>•</span>
                <span>{job.location} {job.country ? `(${job.country})` : ''}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="bg-gray-100 px-2 py-0.5 rounded">{job.workType || 'Full-time'}</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded">{job.salaryRange || 'Salary not specified'}</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{job.companyBucket || 'Unknown size'}</span>
              </div>
              {job.companyProfile && (
                <div className="text-xs text-gray-500 italic mt-1">
                  {job.companyProfile.Sector} • {job.companyProfile.Industry}
                </div>
              )}
            </div>
          </div>
          
          
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Required Skills</h3>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {(job.skills && job.skills.length > 0) || (job.requiredQualities && job.requiredQualities.length > 0) ? (
                <>
                  {(job.skills || job.requiredQualities).slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.skills || job.requiredQualities).length > 3 && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{(job.skills || job.requiredQualities).length - 3}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500 text-xs">No skills specified</span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Benefits</h3>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {job.benefits ? (
                <>
                  {job.benefits.split(',').slice(0, 4).map((benefit, idx) => {
                    const cleanedBenefit = benefit.trim().replace(/^['"]|['"]$/g, '');
                    if (!cleanedBenefit) return null;
                    return (
                      <span
                        key={`benefit-${idx}`}
                        className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                      >
                        {cleanedBenefit}
                      </span>
                    );
                  })}
                  {job.benefits.split(',').length > 4 && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{job.benefits.split(',').length - 4}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500 text-xs">No benefits specified</span>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Indicateurs de swipe */}
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
    </motion.div>
  )
}