import { Link } from 'react-router-dom'

const sections = [
  {
    to: '/transit',
    title: 'NYC Transit Explorer',
    description: 'Four interactive maps on how the subway and bike network serve New York — access gaps, ridership over a day, crash outcomes after protected lanes, and network growth since 1997.',
    meta: '4 maps',
    accent: 'linear-gradient(135deg, #0d47a1 0%, #42a5f5 50%, #a50026 100%)',
  },
  {
    to: '/civic-tech',
    title: 'Civic Tech Startups',
    description: 'A working database of companies building transit, urban planning, and civic infrastructure tools — tracked while researching where to apply.',
    meta: 'In progress',
    accent: 'linear-gradient(135deg, #14b8a6 0%, #6b9fff 50%, #a78bfa 100%)',
  },
]

export default function Home() {
  return (
    <div style={s.page}>
      <Link to="/archive" style={s.archiveButton}>Archive</Link>

      <header style={s.header}>
        <h1 style={s.title}>Andrew Zhang</h1>
        <p style={s.subtitle}>
          Projects on cities, transit, and the people who move through them.
        </p>
      </header>

      <div style={s.grid}>
        {sections.map(section => (
          <Link key={section.to} to={section.to} style={s.cardLink}>
            <div style={s.card}>
              <div style={{ ...s.cardAccent, background: section.accent }} />
              <div style={s.cardBody}>
                <div style={s.cardHead}>
                  <h2 style={s.cardTitle}>{section.title}</h2>
                  <span style={s.cardMeta}>{section.meta}</span>
                </div>
                <p style={s.cardDesc}>{section.description}</p>
                <span style={s.cardCta}>Open →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0f0f1a',
    color: '#e8e8f0',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '96px 24px 40px',
  },
  archiveButton: {
    position: 'fixed',
    top: 20,
    right: 24,
    fontSize: 13,
    fontWeight: 500,
    color: '#9090aa',
    textDecoration: 'none',
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 8,
    padding: '7px 14px',
  },
  header: {
    textAlign: 'center',
    maxWidth: 560,
    marginBottom: 56,
  },
  title: {
    fontSize: 40,
    fontWeight: 700,
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 16,
    color: '#9090aa',
    lineHeight: 1.6,
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
    width: '100%',
    maxWidth: 760,
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  card: {
    background: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #2a2a40',
    height: '100%',
  },
  cardAccent: {
    height: 6,
  },
  cardBody: {
    padding: '20px 22px 24px',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  cardMeta: {
    fontSize: 11,
    color: '#5a5a72',
    whiteSpace: 'nowrap',
  },
  cardDesc: {
    fontSize: 13,
    color: '#8888a8',
    lineHeight: 1.6,
    margin: '0 0 16px',
  },
  cardCta: {
    fontSize: 13,
    color: '#6b9fff',
    fontWeight: 500,
  },
}
