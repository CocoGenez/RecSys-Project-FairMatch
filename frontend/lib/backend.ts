import { User, Candidate, JobOffer, Swipe, UserRole } from './types'

const STORAGE_KEYS = {
  users: 'fairmatch_users',
  candidates: 'fairmatch_candidates',
  jobs: 'fairmatch_jobs',
  swipes: 'fairmatch_swipes',
}

// Users
export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers()
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: Date.now(),
  }
  users.push(newUser)
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  return newUser
}

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]')
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id)
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email === email)
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers()
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return null
  
  users[index] = { ...users[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  return users[index]
}

// Candidates
export function createCandidate(candidate: Omit<Candidate, 'id' | 'createdAt'>): Candidate {
  const candidates = getCandidates()
  const newCandidate: Candidate = {
    ...candidate,
    id: Date.now().toString(),
    createdAt: Date.now(),
  }
  candidates.push(newCandidate)
  localStorage.setItem(STORAGE_KEYS.candidates, JSON.stringify(candidates))
  return newCandidate
}

export function getCandidates(): Candidate[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.candidates) || '[]')
}

export function getCandidateById(id: string): Candidate | undefined {
  return getCandidates().find(c => c.id === id)
}

export function getCandidateByUserId(userId: string): Candidate | undefined {
  return getCandidates().find(c => c.userId === userId)
}

export function updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
  const candidates = getCandidates()
  const index = candidates.findIndex(c => c.id === id)
  if (index === -1) return null
  
  candidates[index] = { ...candidates[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.candidates, JSON.stringify(candidates))
  return candidates[index]
}

// Jobs
export function createJob(job: Omit<JobOffer, 'id' | 'createdAt'>): JobOffer {
  const jobs = getJobs()
  const newJob: JobOffer = {
    ...job,
    requiredQualities: job.requiredQualities || [],
    id: Date.now().toString(),
    createdAt: Date.now(),
  }
  jobs.push(newJob)
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs))
  return newJob
}

export function getJobs(): JobOffer[] {
  const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.jobs) || '[]')
  return jobs.map((job: any) => ({
    ...job,
    requiredQualities: job.requiredQualities || [],
  }))
}

export function getJobById(id: string): JobOffer | undefined {
  return getJobs().find(j => j.id === id)
}

export function getJobsByRecruiterId(recruiterId: string): JobOffer[] {
  return getJobs().filter(j => j.recruiterId === recruiterId)
}

export function updateJob(id: string, updates: Partial<JobOffer>): JobOffer | null {
  const jobs = getJobs()
  const index = jobs.findIndex(j => j.id === id)
  if (index === -1) return null
  
  jobs[index] = { ...jobs[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs))
  return jobs[index]
}

// Swipes
export function createSwipe(swipe: Omit<Swipe, 'timestamp'>): Swipe {
  const swipes = getSwipes()
  const newSwipe: Swipe = {
    ...swipe,
    timestamp: Date.now(),
  }
  
  // Check if swipe already exists
  const existingIndex = swipes.findIndex(
    s => s.userId === swipe.userId && s.itemId === swipe.itemId && s.type === swipe.type
  )
  
  if (existingIndex !== -1) {
    swipes[existingIndex] = newSwipe
  } else {
    swipes.push(newSwipe)
  }
  
  localStorage.setItem(STORAGE_KEYS.swipes, JSON.stringify(swipes))
  return newSwipe
}

export function getSwipes(): Swipe[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.swipes) || '[]')
}

export function getLikedItems(userId: string, type: 'candidate' | 'job'): string[] {
  return getSwipes()
    .filter(s => s.userId === userId && s.type === type && s.action === 'like')
    .map(s => s.itemId)
}

export function getPassedItems(userId: string, type: 'candidate' | 'job'): string[] {
  return getSwipes()
    .filter(s => s.userId === userId && s.type === type && s.action === 'pass')
    .map(s => s.itemId)
}

export function hasSwiped(userId: string, itemId: string, type: 'candidate' | 'job'): boolean {
  return getSwipes().some(s => s.userId === userId && s.itemId === itemId && s.type === type)
}

