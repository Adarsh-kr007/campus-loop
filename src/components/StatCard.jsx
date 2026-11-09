export default function StatCard({ icon: Icon, label, value, tone = 'teal' }) {
  return <article className={`stat-card stat-card--${tone}`}><span className="stat-card__icon"><Icon size={19} aria-hidden="true" /></span><div><span className="stat-card__label">{label}</span><strong className="stat-card__value">{value ?? '?'}</strong></div></article>
}
