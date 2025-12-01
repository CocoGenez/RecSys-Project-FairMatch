// Gestion des swipes avec localStorage

export interface Swipe {
  userId: string
  itemId: string
  type: 'candidate' | 'job'
  action: 'like' | 'pass'
  timestamp: number
}

export function saveSwipe(userId: string, itemId: string, type: 'candidate' | 'job', action: 'like' | 'pass') {
  const swipes = getSwipes()
  const swipe: Swipe = {
    userId,
    itemId,
    type,
    action,
    timestamp: Date.now()
  }
  
  // Vérifier si le swipe existe déjà
  const existingIndex = swipes.findIndex(
    s => s.userId === userId && s.itemId === itemId && s.type === type
  )
  
  if (existingIndex !== -1) {
    swipes[existingIndex] = swipe
  } else {
    swipes.push(swipe)
  }
  
  localStorage.setItem('swipes', JSON.stringify(swipes))
}

export function getSwipes(): Swipe[] {
  return JSON.parse(localStorage.getItem('swipes') || '[]')
}

export function getLikedItems(userId: string, type: 'candidate' | 'job'): string[] {
  const swipes = getSwipes()
  return swipes
    .filter(s => s.userId === userId && s.type === type && s.action === 'like')
    .map(s => s.itemId)
}

export function getPassedItems(userId: string, type: 'candidate' | 'job'): string[] {
  const swipes = getSwipes()
  return swipes
    .filter(s => s.userId === userId && s.type === type && s.action === 'pass')
    .map(s => s.itemId)
}

export function hasSwiped(userId: string, itemId: string, type: 'candidate' | 'job'): boolean {
  const swipes = getSwipes()
  return swipes.some(s => s.userId === userId && s.itemId === itemId && s.type === type)
}






