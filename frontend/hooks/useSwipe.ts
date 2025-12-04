import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { saveSwipe as saveSwipeLocal } from '@/lib/swipes'
import { Candidate, JobOffer } from '@/lib/data'
import { saveInteraction } from '@/lib/api'

export function useSwipe(items: (Candidate | JobOffer)[]) {
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isAnimating || currentIndex >= items.length) return

    setIsAnimating(true)
    const currentItem = items[currentIndex]

    if (user && currentItem) {
      const itemType = user.role === 'recruiter' ? 'candidate' : 'job'
      const action = direction === 'right' ? 'like' : 'pass'
      
      // Save locally
      saveSwipeLocal(user.id, currentItem.id, itemType, action)

      // Save to backend
      try {
        let userId = user.id
        
        // If the ID is valid
        if (userId && !isNaN(parseInt(userId))) {
          await saveInteraction({
            user_id: parseInt(userId),
            item_id: currentItem.id,
            type: itemType,
            action: action,
            timestamp: new Date().toISOString()
          })
        }
      } catch (e) {
        console.error("Failed to save interaction to backend", e)
      }
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsAnimating(false)
    }, 300)
  }

  return {
    currentIndex,
    isAnimating,
    handleSwipe,
    currentItems: items.slice(currentIndex, currentIndex + 3)
  }

}

