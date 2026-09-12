export type Status = 'researching' | 'interested' | 'applied' | 'interviewing' | 'passed'

export interface Founder {
  name: string
  role: string
}

export interface Company {
  name: string
  website: string
  careers: string
  description: string
  focusAreas: string[]
  founders: Founder[]
  size: string
  stage: string
  status: Status
  notes: string
  source: string
}

export const companies: Company[] = [
  {
    name: 'Replica',
    website: 'https://www.replicahq.com',
    careers: 'https://replicahq.com/careers',
    description:
      'Builds synthetic population models of travel behavior from de-identified location data, used by government agencies for transportation and land-use planning. Spun out of Sidewalk Labs in 2019.',
    focusAreas: ['transportation planning', 'urban data', 'govtech'],
    founders: [{ name: 'Nick Bowden', role: 'Co-founder & CEO' }],
    size: '~50 (2026)',
    stage: 'Series B ($41M, 2021)',
    status: 'researching',
    notes: 'Started as a Sidewalk Labs project in 2017 with a 13-person team at spinout. Near the data-collection line: the models are built on de-identified mobile location data, so worth checking how that data is sourced.',
    source: 'https://techcrunch.com/2019/09/12/sidewalk-labs-spins-out-urban-data-gathering-tool-replica-into-a-company/',
  },
  {
    name: 'Via',
    website: 'https://ridewithvia.com',
    careers: 'https://ridewithvia.com/careers/jobs',
    description:
      'TransitTech platform: on-demand microtransit software and operations for public transit agencies, schools, and healthcare providers. Founded 2012, now public (NYSE: VIA).',
    focusAreas: ['public transit', 'microtransit', 'govtech'],
    founders: [
      { name: 'Daniel Ramot', role: 'Co-founder & CEO' },
      { name: 'Oren Shoval', role: 'Co-founder' },
    ],
    size: '~950 (2026)',
    stage: 'Public (NYSE: VIA)',
    status: 'researching',
    notes: 'Headcount varies by source: Wikipedia lists 950, Tracxn lists 2,046 as of Apr 2026.',
    source: 'https://en.wikipedia.org/wiki/Via_Transportation',
  },
  {
    name: 'Optibus',
    website: 'https://www.optibus.com',
    careers: 'https://optibus.com/company/careers/jobs/',
    description:
      'Optimization platform for public transport scheduling and operations: builds vehicle and driver schedules, plans routes, and runs day-of operations for transit agencies and private operators. Founded 2014, headquartered in Tel Aviv.',
    focusAreas: ['public transit', 'transit operations', 'govtech'],
    founders: [
      { name: 'Amos Haggiag', role: 'Co-founder & CEO' },
      { name: 'Eitan Yanovsky', role: 'Co-founder & CTO' },
    ],
    size: '~350 (2026)',
    stage: 'Series D ($100M, 2022)',
    status: 'researching',
    notes: 'First public-transit-software unicorn at a $1.3B valuation; $260M raised total. Acquired Trillium (passenger information systems) in 2022.',
    source: 'https://techcrunch.com/2022/05/16/optibus-taps-100m-at-a-1-3b-valuation-for-its-ai-based-mass-transit-operations-platform/',
  },
  {
    name: 'Swiftly',
    website: 'https://www.goswift.ly',
    careers: 'https://jobs.lever.co/goswift',
    description:
      'Transit data platform for agencies: real-time vehicle tracking and passenger-facing arrival predictions, on-time performance analytics, and day-of operations tools built on agency GPS and GTFS feeds. Founded 2014, headquartered in San Francisco.',
    focusAreas: ['public transit', 'transit operations', 'urban data'],
    founders: [
      { name: 'Jonny Simkin', role: 'Co-founder & CEO' },
      { name: 'Michael Smith', role: 'Co-founder' },
      { name: 'Will Dayton', role: 'Co-founder' },
    ],
    size: '~110 (2026)',
    stage: 'Growth equity (Cove Hill, 2025)',
    status: 'researching',
    notes: 'Serves 190+ transit agencies across 12 countries. Headcount estimates range 108-129 across aggregators.',
    source: 'https://www.goswift.ly/blog/cove-hill-partners-investment',
  },
  {
    name: 'Transit',
    website: 'https://transitapp.com',
    careers: 'https://manifesto.transitapp.com/jobs',
    description:
      'Rider-facing trip planner covering buses, trains, bike share, and scooters in 1,100+ metro areas, plus agency partnerships that white-label the app and feed back real-time crowdsourced vehicle positions. Built in Montreal; app first released 2012.',
    focusAreas: ['public transit', 'rider experience', 'govtech'],
    founders: [
      { name: 'Sam Vermette', role: 'Co-founder & CEO' },
      { name: 'Guillaume Campagna', role: 'Co-founder & CTO' },
    ],
    size: '100+ (2026)',
    stage: 'Series B ($17.5M, 2018)',
    status: 'researching',
    notes: 'Company site says "100+"; PitchBook lists 180. Reported to run a four-day work week at full salary, unconfirmed on Transit\'s own pages.',
    source: 'https://manifesto.transitapp.com/team',
  },
  {
    name: 'OpenGov',
    website: 'https://opengov.com',
    careers: 'https://jobs.ashbyhq.com/opengov',
    description:
      'Cloud ERP for state and local government: budgeting and planning, procurement, permitting and licensing, and asset management, used by 2,000+ communities. Founded 2012 out of the California Common Sense open-data nonprofit.',
    focusAreas: ['govtech', 'government ERP', 'permitting'],
    founders: [
      { name: 'Zachary Bookman', role: 'Co-founder; CEO 2012-2026' },
      { name: 'Joe Lonsdale', role: 'Co-founder' },
      { name: 'Nate Levine', role: 'Co-founder' },
      { name: 'Dakin Sloss', role: 'Co-founder' },
    ],
    size: '~800 (2026)',
    stage: 'Cox majority stake ($1.8B, 2024)',
    status: 'researching',
    notes: 'Thiago Sa Freire, previously president and COO, took over as CEO in April 2026. Grew partly by acquisition: Cartegraph (2022), ProcureNow (2021), ViewPoint Cloud (2019).',
    source: 'https://www.coxenterprises.com/press-releases/cox-enterprises-acquires-majority-ownership-of-opengov',
  },
  {
    name: 'Civic Roundtable',
    website: 'https://www.civicroundtable.com',
    careers: 'https://jobs.ashbyhq.com/Civic%20Roundtable',
    description:
      'Government operations platform for coordinating work across agencies, programs, and partner organizations, built around peer networks that let public servants share practice and institutional knowledge. Founded 2022 at the Harvard Innovation Labs; based in Boston.',
    focusAreas: ['govtech', 'public sector collaboration'],
    founders: [
      { name: 'Madeleine Smith', role: 'Co-founder & CEO' },
      { name: 'Austin Boral', role: 'Co-founder' },
      { name: 'Josh Seiden', role: 'Co-founder' },
    ],
    size: '~25 (2026)',
    stage: 'Seed ($5M, 2024)',
    status: 'researching',
    notes: 'Used by public servants at 4,000+ organizations across all 50 states. Smith and Boral incubated it as Harvard MBA/MPA students; Seiden joined from Mark43.',
    source: 'https://www.civicroundtable.com/blog/civic-roundtable-raises-5m-from-general-catalyst-to-transform-how-government-solves-problems',
  },
  {
    name: 'Recidiviz',
    website: 'https://www.recidiviz.org',
    careers: 'https://job-boards.greenhouse.io/recidiviz',
    description:
      'Nonprofit building open-source data tools for state criminal justice agencies: pulls fragmented corrections data into dashboards that surface who is eligible for release, diversion, or reduced supervision. Began as a volunteer project at Google; standalone nonprofit since 2019.',
    focusAreas: ['govtech', 'criminal justice', 'public sector data'],
    founders: [
      { name: 'Clementine Jacoby', role: 'Co-founder & CEO' },
      { name: 'Andrew Warren', role: 'Co-founder' },
      { name: 'Joshua Essex', role: 'Co-founder' },
    ],
    size: '~76 (2024)',
    stage: 'Nonprofit (philanthropic funding)',
    status: 'researching',
    notes: 'Not venture-backed: a 501(c)(3) funded by Arnold Ventures, Chan Zuckerberg Initiative, and Mozilla Foundation, with a roughly $15M operating budget (FY2024). Reports helping ~70,000 people across 11 states leave prison or parole.',
    source: 'https://www.recidiviz.org/about',
  },
  {
    name: 'Spare',
    website: 'https://spare.com',
    careers: 'https://jobs.ashbyhq.com/spare',
    description:
      'Demand-response transit platform: booking, dispatch, routing, and eligibility screening for ADA paratransit and microtransit, sold to public agencies and private operators across 200+ cities. Founded 2015 in Vancouver.',
    focusAreas: ['public transit', 'microtransit', 'transit operations'],
    founders: [
      { name: 'Kristoffer Vik Hansen', role: 'Co-founder & CEO' },
      { name: 'Josh Andrews', role: 'Co-founder' },
      { name: 'Alexey Indeev', role: 'Co-founder' },
    ],
    size: '~280 (2026)',
    stage: 'Series B (C$42M, 2024)',
    status: 'researching',
    notes: 'Series B is C$42M Canadian, led by Inovia; ~$65M raised total. Won the MBTA paratransit contract in 2025, which it calls the largest fully automated paratransit service in North America. Agency customers include DART, BART, and AC Transit.',
    source: 'https://spare.com/press-releases/spare-secures-42m-in-series-b-funding-to-accelerate-growth-in-demand-response-transit-solutions',
  },
]
