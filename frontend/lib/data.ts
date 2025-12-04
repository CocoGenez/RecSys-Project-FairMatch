// Mock data for candidates and job offers

export interface Candidate {
  id: string
  name: string
  photo: string
  skills: string[]
  experience: string
  location: string
  bio: string
}

export interface JobOffer {
  id: string
  title: string
  company: string
  location: string
  requiredSkills: string[]
  description: string
  salary?: string
  logo?: string
}

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sophie Martin',
    photo: 'https://i.pravatar.cc/300?img=1',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    experience: '5 ans',
    location: 'Paris, France',
    bio: 'Développeuse full-stack passionnée par les technologies modernes et les interfaces utilisateur intuitives.'
  },
  {
    id: '2',
    name: 'Lucas Dubois',
    photo: 'https://i.pravatar.cc/300?img=12',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    experience: '3 ans',
    location: 'Lyon, France',
    bio: 'Ingénieur logiciel spécialisé en backend, avec une forte expérience en architecture scalable.'
  },
  {
    id: '3',
    name: 'Emma Bernard',
    photo: 'https://i.pravatar.cc/300?img=5',
    skills: ['Vue.js', 'Nuxt.js', 'GraphQL', 'AWS'],
    experience: '4 ans',
    location: 'Toulouse, France',
    bio: 'Développeuse frontend créative, experte en frameworks JavaScript modernes et design systems.'
  },
  {
    id: '4',
    name: 'Thomas Leroy',
    photo: 'https://i.pravatar.cc/300?img=20',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'Microservices'],
    experience: '6 ans',
    location: 'Nantes, France',
    bio: 'Architecte logiciel avec une expertise en systèmes distribués et cloud computing.'
  },
  {
    id: '5',
    name: 'Léa Moreau',
    photo: 'https://i.pravatar.cc/300?img=9',
    skills: ['React Native', 'Flutter', 'Firebase', 'CI/CD'],
    experience: '3 ans',
    location: 'Bordeaux, France',
    bio: 'Développeuse mobile passionnée, créant des applications natives et cross-platform.'
  },
  {
    id: '6',
    name: 'Alexandre Petit',
    photo: 'https://i.pravatar.cc/300?img=15',
    skills: ['Angular', 'RxJS', 'NgRx', 'TypeScript'],
    experience: '4 ans',
    location: 'Marseille, France',
    bio: 'Développeur frontend spécialisé en Angular, avec une passion pour les architectures réactives.'
  },
  {
    id: '7',
    name: 'Camille Rousseau',
    photo: 'https://i.pravatar.cc/300?img=33',
    skills: ['Go', 'Rust', 'Distributed Systems', 'Blockchain'],
    experience: '5 ans',
    location: 'Lille, France',
    bio: 'Ingénieur système expert en langages bas niveau et technologies émergentes.'
  },
  {
    id: '8',
    name: 'Hugo Blanc',
    photo: 'https://i.pravatar.cc/300?img=47',
    skills: ['PHP', 'Laravel', 'MySQL', 'Redis'],
    experience: '4 ans',
    location: 'Strasbourg, France',
    bio: 'Développeur full-stack avec une solide expérience en développement web traditionnel et moderne.'
  }
]

export const mockJobOffers: JobOffer[] = [
  {
    id: '1',
    title: 'Développeur Full-Stack React/Node.js',
    company: 'TechCorp',
    location: 'Paris, France',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    description: 'Rejoignez notre équipe dynamique pour développer des applications web modernes et innovantes.',
    salary: '50k-70k€',
    logo: '🏢'
  },
  {
    id: '2',
    title: 'Ingénieur Backend Python',
    company: 'DataFlow',
    location: 'Lyon, France',
    requiredSkills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    description: 'Opportunité passionnante pour construire des APIs robustes et scalables.',
    salary: '45k-65k€',
    logo: '💼'
  },
  {
    id: '3',
    title: 'Développeur Frontend Vue.js',
    company: 'WebStudio',
    location: 'Toulouse, France',
    requiredSkills: ['Vue.js', 'Nuxt.js', 'GraphQL', 'AWS'],
    description: 'Créez des expériences utilisateur exceptionnelles avec les dernières technologies frontend.',
    salary: '48k-68k€',
    logo: '🎨'
  },
  {
    id: '4',
    title: 'Architecte Java Spring Boot',
    company: 'Enterprise Solutions',
    location: 'Nantes, France',
    requiredSkills: ['Java', 'Spring Boot', 'Kubernetes', 'Microservices'],
    description: 'Concevez et implémentez des architectures microservices à grande échelle.',
    salary: '60k-80k€',
    logo: '🏛️'
  },
  {
    id: '5',
    title: 'Développeur Mobile React Native',
    company: 'AppMakers',
    location: 'Bordeaux, France',
    requiredSkills: ['React Native', 'Firebase', 'CI/CD', 'TypeScript'],
    description: 'Développez des applications mobiles cross-platform pour des millions d\'utilisateurs.',
    salary: '50k-70k€',
    logo: '📱'
  },
  {
    id: '6',
    title: 'Développeur Angular Senior',
    company: 'Frontend Pro',
    location: 'Marseille, France',
    requiredSkills: ['Angular', 'RxJS', 'NgRx', 'TypeScript'],
    description: 'Rejoignez une équipe de développeurs experts pour créer des applications enterprise.',
    salary: '55k-75k€',
    logo: '⚡'
  },
  {
    id: '7',
    title: 'Ingénieur Go/Rust',
    company: 'Blockchain Labs',
    location: 'Lille, France',
    requiredSkills: ['Go', 'Rust', 'Distributed Systems', 'Blockchain'],
    description: 'Travaillez sur des projets blockchain innovants avec des technologies de pointe.',
    salary: '65k-85k€',
    logo: '⛓️'
  },
  {
    id: '8',
    title: 'Développeur PHP Laravel',
    company: 'WebDev Agency',
    location: 'Strasbourg, France',
    requiredSkills: ['PHP', 'Laravel', 'MySQL', 'Redis'],
    description: 'Développez des solutions web robustes pour des clients variés.',
    salary: '42k-60k€',
    logo: '🌐'
  }
]






