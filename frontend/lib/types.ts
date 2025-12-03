// Types pour l'application

export type UserRole = 'recruiter' | 'jobseeker'

export interface User {
  id: string
  email: string
  password: string
  role: UserRole
  createdAt: number
}

export interface Candidate {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  photo?: string
  skills: string[]
  qualities: string[]
  location: string
  bio: string
  cvType: 'pdf' | 'form'
  cvPdfUrl?: string
  cvFormData?: {
    experiences: Experience[]
    education: Education[]
    languages?: Language[]
    certifications?: string[]
  }
  createdAt: number
}

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
  current: boolean
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate?: string
  current: boolean
}

export interface Language {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native'
}

export interface JobOffer {
  id: string
  recruiterId: string
  title: string
  company: string
  location: string
  objectives: string
  startDate: string
  requiredQualities: string[]
  descriptionType: 'text' | 'document' | 'link'
  description?: string
  documentUrl?: string
  documentName?: string
  externalLink?: string
  createdAt: number
  role?: string
  country?: string
  experience?: string
  qualifications?: string
  workType?: string
  companyBucket?: string
  benefits?: string
  companyProfile?: any
  salaryRange?: string
  skills?: string[]
}

export interface Swipe {
  userId: string
  itemId: string
  type: 'candidate' | 'job'
  action: 'like' | 'pass'
  timestamp: number
}


