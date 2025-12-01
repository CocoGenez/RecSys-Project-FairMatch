// Liste des qualités prédéfinies pour le filtrage intelligent

export const PREDEFINED_QUALITIES = [
  'autonome',
  'rigoureux',
  'communication',
  'team-work',
  'leadership',
  'créatif',
  'analytique',
  'organisé',
  'flexible',
  'proactif',
  'motivé',
  'curieux',
  'adaptable',
  'résilient',
  'empathique',
  'déterminé',
  'innovant',
  'collaboratif',
  'efficace',
  'méthodique',
  'persévérant',
  'optimiste',
  'diplomate',
  'dynamique',
  'sérieux',
  'polyvalent',
  'ambitieux',
  'patient',
  'réactif',
  'stratégique',
]

export function filterQualities(searchTerm: string): string[] {
  if (!searchTerm.trim()) {
    return PREDEFINED_QUALITIES
  }
  
  const term = searchTerm.toLowerCase().trim()
  return PREDEFINED_QUALITIES.filter(quality =>
    quality.toLowerCase().includes(term)
  )
}





