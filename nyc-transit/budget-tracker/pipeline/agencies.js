// The one agency mapping for this feature. Operating data uses the IDs below
// directly; the capital plan's one-letter codes map onto them.
export const AGENCY_NAMES = {
  NYCT: 'New York City Transit',
  LIRR: 'Long Island Rail Road',
  MNR: 'Metro-North Railroad',
  BT: 'Bridges and Tunnels',
  MTABC: 'MTA Bus Company',
  SIR: 'Staten Island Railway',
  MTAHQ: 'MTA Headquarters',
  CD: 'MTA Construction & Development',
  FMTAC: 'First Mutual Transportation Assurance Company',
  GCMCOC: 'Grand Central Madison Concourse Operating Company',
  CBDTP: 'Central Business District Tolling Program',
  CRR: 'Commuter Railroads (LIRR + Metro-North)',
  'Non-Agency Corporate Account': 'Non-Agency Corporate Account',
  'MTA Interagency': 'MTA Interagency',
  'Major Projects and Expansion': 'Major Projects and Expansion',
}

// Shown on the agency's card.
export const AGENCY_NOTES = {
  CRR: 'Name inferred. The dataset reports debt service for the Long Island Rail Road and Metro-North combined under "CRR".',
}

export const AGENCY_ID_BY_CAPITAL_CODE = {
  T: 'NYCT',
  L: 'LIRR',
  M: 'MNR',
  D: 'BT',
  U: 'MTABC',
  S: 'SIR',
  N: 'MTA Interagency',
  G: 'Major Projects and Expansion',
}

export function agencyNamesFor(ids) {
  return Object.fromEntries([...new Set(ids)].sort().map(id => [id, AGENCY_NAMES[id]]))
}

export function agencyNotesFor(ids) {
  return Object.fromEntries([...new Set(ids)].sort().filter(id => AGENCY_NOTES[id]).map(id => [id, AGENCY_NOTES[id]]))
}
