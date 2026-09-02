export type Status = 'researching' | 'interested' | 'applied' | 'interviewing' | 'passed'

export interface Company {
  name: string
  website: string
  description: string
  focusAreas: string[]
  stage: string
  status: Status
  notes: string
  source: string
}

export const companies: Company[] = [
  {
    name: 'Replica',
    website: 'https://www.replicahq.com',
    description:
      'Builds synthetic population models of travel behavior from de-identified location data, used by government agencies for transportation and land-use planning. Spun out of Sidewalk Labs in 2019.',
    focusAreas: ['transportation planning', 'urban data', 'govtech'],
    stage: 'Series B ($41M, 2021)',
    status: 'researching',
    notes: '',
    source: '',
  },
  {
    name: 'Via',
    website: 'https://ridewithvia.com',
    description:
      'TransitTech platform: on-demand microtransit software and operations for public transit agencies, schools, and healthcare providers. Founded 2012, now public (NYSE: VIA).',
    focusAreas: ['public transit', 'microtransit', 'govtech'],
    stage: 'Public (NYSE: VIA)',
    status: 'researching',
    notes: '',
    source: '',
  },
]
