import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { mockCandidates, mockJobOffers, Candidate, JobOffer } from '@/lib/data'
import { getLikedItems, getPassedItems } from '@/lib/swipes'
import { getRecommendations } from '@/lib/api'

export function useRecommendations() {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<(Candidate | JobOffer)[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!user.role) {
      router.push('/select-role')
      return
    }

    const fetchData = async () => {
      // Charger les items selon le rôle
      if (user.role === 'recruiter') {
        console.log("Fetching recruiter items")
        const liked = getLikedItems(user.id, 'candidate')
        const passed = getPassedItems(user.id, 'candidate')
        const available = mockCandidates.filter(
          c => !liked.includes(c.id) && !passed.includes(c.id)
        )
        setItems(available)
      } else {
        console.log("Fetching jobseeker items for user:", user)

        try {
          // Should work with this
          const userId = user.id;

          if (userId && !isNaN(parseInt(userId))) {
             console.log("Calling getRecommendations (NEW) with ID:", userId)
             const data = await getRecommendations(parseInt(userId))
             console.log("Got recommendations:", data)
             if (data && data.recommendations) {

               // Adapt backend data to frontend interface
               const adaptedJobs: JobOffer[] = data.recommendations.map((job: any) => {
                 let companyProfile = null;
                 try {
                   if (typeof job.company_profile === 'string') {
                     companyProfile = JSON.parse(job.company_profile);
                   } else {
                     companyProfile = job.company_profile;
                   }
                 } catch (e) {
                   console.error("Error parsing company_profile", e);
                 }

                 let benefits = job.benefits;
                 if (typeof benefits === 'string' && benefits.startsWith("{'") && benefits.endsWith("'}")) {
                   benefits = benefits.substring(2, benefits.length - 2);
                 }

                 return {
                   id: job.job_id.toString(),
                   title: job.title,
                   company: job.company,
                   location: job.location,
                   requiredSkills: job.skills,
                   description: job.description,
                   salary: job.salary_range,
                   logo: '💼',
                   role: job.role,
                   country: job.country,
                   experience: job.experience,
                   qualifications: job.qualifications,
                   workType: job.work_type,
                   companyBucket: job.company_bucket,
                   benefits: benefits,
                   companyProfile: companyProfile,
                   salaryRange: job.salary_range,
                   skills: job.skills
                 };
               })

               // Filter out already swiped items
               const liked = getLikedItems(user.id, 'job')
               const passed = getPassedItems(user.id, 'job')
               const filteredJobs = adaptedJobs.filter(
                 job => !liked.includes(job.id) && !passed.includes(job.id)
               )

               setItems(filteredJobs)
               return
             }
          }
        } catch (e) {
          console.error("Failed to fetch recommendations, falling back to mock", e)
        }

        // Fallback to mock
        const liked = getLikedItems(user.id, 'job')
        const passed = getPassedItems(user.id, 'job')
        const available = mockJobOffers.filter(
          j => !liked.includes(j.id) && !passed.includes(j.id)
        )
        setItems(available)
      }
    }

    fetchData()
  }, [user, router])

  return { items, user }
}
