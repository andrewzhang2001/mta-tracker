import { Link } from 'react-router-dom'

const projects = [
  {
    to: '/archive/simple-navigation',
    title: 'Simple Navigation',
    tagline: 'Real-time door-to-door subway tracker',
    description:
      "Next departures for one hardcoded commute — 320 E 52nd St to 100 Dobbin St — off the MTA's live GTFS-RT feeds. Walk, E to Court Sq, transfer, G to Nassau Av, walk.",
    stack: ['GTFS-RT', 'protobuf', 'React'],
    archived: 'August 2026',
    reason:
      'Was a standalone Flask app. The MTA feeds dropped their API-key requirement and now send permissive CORS headers, so the trip logic moved to the browser and the server went away. The Python version lives on only in git history, at simple_navigation/ up to commit f536d0c.',
  },
]

export default function ArchivePage() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <Link to="/" style={s.back}>← Back</Link>
          <h1 style={s.title}>Archive</h1>
          <p style={s.subtitle}>
            Retired projects, kept working. Each one still runs — they're just no longer
            developed, and they don't get a card on the home page.
          </p>
        </header>

        <ul style={s.list}>
          {projects.map(p => (
            <li key={p.to} style={s.item}>
              <div style={s.itemHead}>
                <h2 style={s.itemTitle}>{p.title}</h2>
                <span style={s.archived}>Archived {p.archived}</span>
              </div>

              <p style={s.tagline}>{p.tagline}</p>
              <p style={s.desc}>{p.description}</p>

              <div style={s.stack}>
                {p.stack.map(tech => (
                  <span key={tech} style={s.chip}>{tech}</span>
                ))}
              </div>

              <p style={s.reason}>{p.reason}</p>

              <Link to={p.to} style={s.link}>Open it →</Link>
            </li>
          ))}
        </ul>

        <footer style={s.footer}>
          Archived means feature-frozen, not switched off.
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
    maxWidth: 680,
    margin: '0 auto',
    padding: '56px 24px 48px',
  },
  header: {
    marginBottom: 40,
  },
  back: {
    fontSize: 13,
    color: '#6b9fff',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: 24,
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
  list: {
    listStyle: 'none',
    display: 'grid',
    gap: 16,
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
  archived: {
    fontSize: 11,
    color: '#5a5a72',
    whiteSpace: 'nowrap',
  },
  tagline: {
    fontSize: 13,
    color: '#8888a8',
    margin: '0 0 12px',
  },
  desc: {
    fontSize: 13,
    color: '#a8a8c0',
    lineHeight: 1.65,
    margin: '0 0 14px',
  },
  stack: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    fontSize: 11,
    color: '#8888a8',
    background: '#22223a',
    border: '1px solid #2f2f48',
    borderRadius: 999,
    padding: '3px 9px',
  },
  reason: {
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
  footer: {
    marginTop: 40,
    fontSize: 11,
    color: '#44445a',
  },
}
