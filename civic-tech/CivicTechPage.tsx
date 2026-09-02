import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { companies, type Status } from './data/companies'

const STATUS_LABEL: Record<Status, string> = {
  researching: 'Researching',
  interested: 'Interested',
  applied: 'Applied',
  interviewing: 'Interviewing',
  passed: 'Passed',
}

const ALL_FOCUS_AREAS = [...new Set(companies.flatMap(c => c.focusAreas))].sort()

export default function CivicTechPage() {
  const [activeFocus, setActiveFocus] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<Status | 'all'>('all')

  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (activeFocus && !c.focusAreas.includes(activeFocus)) return false
      if (activeStatus !== 'all' && c.status !== activeStatus) return false
      return true
    })
  }, [activeFocus, activeStatus])

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <Link to="/" style={s.back}>← All projects</Link>
          <h1 style={s.title}>Civic Tech Startups</h1>
          <p style={s.subtitle}>
            Companies working on transit, urban planning, and civic infrastructure —
            tracked while researching where to apply. Still in early discovery.
          </p>
        </header>

        <div style={s.filters}>
          <button
            style={{ ...s.chip, ...(activeFocus === null ? s.chipActive : {}) }}
            onClick={() => setActiveFocus(null)}
          >
            All focus areas
          </button>
          {ALL_FOCUS_AREAS.map(area => (
            <button
              key={area}
              style={{ ...s.chip, ...(activeFocus === area ? s.chipActive : {}) }}
              onClick={() => setActiveFocus(activeFocus === area ? null : area)}
            >
              {area}
            </button>
          ))}

          <select
            value={activeStatus}
            onChange={e => setActiveStatus(e.target.value as Status | 'all')}
            style={s.select}
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <ul style={s.list}>
          {filtered.map(c => (
            <li key={c.name} style={s.item}>
              <div style={s.itemHead}>
                <h2 style={s.itemTitle}>{c.name}</h2>
                <span style={s.status}>{STATUS_LABEL[c.status]}</span>
              </div>

              <p style={s.desc}>{c.description}</p>

              <div style={s.tagRow}>
                {c.focusAreas.map(area => (
                  <span key={area} style={s.tag}>{area}</span>
                ))}
                <span style={s.stage}>{c.stage}</span>
              </div>

              {c.notes && <p style={s.notes}>{c.notes}</p>}

              <a href={c.website} target="_blank" rel="noreferrer" style={s.link}>
                {c.website.replace(/^https?:\/\//, '')} →
              </a>
            </li>
          ))}
          {filtered.length === 0 && (
            <li style={s.empty}>No companies match these filters.</li>
          )}
        </ul>

        <footer style={s.footer}>
          Data lives in civic-tech/data/companies.ts — add a company by adding a row there.
        </footer>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    height: '100%',
    overflowY: 'auto',
    background: '#0f0f1a',
    color: '#e8e8f0',
    fontFamily: 'system-ui, sans-serif',
  },
  inner: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '56px 24px 48px',
  },
  header: {
    marginBottom: 32,
  },
  back: {
    display: 'block',
    fontSize: 13,
    color: '#6b9fff',
    textDecoration: 'none',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 15,
    color: '#9090aa',
    lineHeight: 1.6,
    margin: 0,
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  chip: {
    fontSize: 12,
    color: '#8888a8',
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 999,
    padding: '5px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  chipActive: {
    color: '#e8e8f0',
    background: '#2a2a4a',
    borderColor: '#6b9fff',
  },
  select: {
    fontSize: 12,
    color: '#8888a8',
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 999,
    padding: '5px 12px',
    fontFamily: 'inherit',
    marginLeft: 'auto',
  },
  list: {
    listStyle: 'none',
    display: 'grid',
    gap: 16,
    margin: 0,
    padding: 0,
  },
  item: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    padding: '20px 22px 22px',
  },
  itemHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  status: {
    fontSize: 11,
    color: '#5a5a72',
    whiteSpace: 'nowrap',
  },
  desc: {
    fontSize: 13,
    color: '#a8a8c0',
    lineHeight: 1.65,
    margin: '0 0 14px',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    fontSize: 11,
    color: '#8888a8',
    background: '#22223a',
    border: '1px solid #2f2f48',
    borderRadius: 999,
    padding: '3px 9px',
  },
  stage: {
    fontSize: 11,
    color: '#70708c',
    marginLeft: 4,
  },
  notes: {
    fontSize: 12,
    color: '#70708c',
    lineHeight: 1.6,
    borderLeft: '2px solid #2f2f48',
    paddingLeft: 12,
    margin: '0 0 16px',
  },
  link: {
    fontSize: 13,
    color: '#6b9fff',
    fontWeight: 500,
    textDecoration: 'none',
  },
  empty: {
    fontSize: 13,
    color: '#5a5a72',
  },
  footer: {
    marginTop: 40,
    fontSize: 11,
    color: '#44445a',
  },
}
