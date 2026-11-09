import { ArrowRight, ArrowUpRight, CheckCircle2, ClipboardList, HeartHandshake, SearchCheck, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import ItemCard from '../components/items/ItemCard.jsx'
import ItemImage from '../components/items/ItemImage.jsx'
import { ItemCardSkeleton } from '../components/common/Skeleton.jsx'
import { useApp } from '../context/AppContext.jsx'
import './Home.css'

const steps = [
  { icon: ClipboardList, number: '01', title: 'Report an item', description: 'Share where and when you lost something or found it on campus.' },
  { icon: SearchCheck, number: '02', title: 'Find a match', description: 'Search the campus listings and filter by item, place, and date.' },
  { icon: ShieldCheck, number: '03', title: 'Verify ownership', description: 'A few identifying details help make sure the right item gets home.' },
  { icon: HeartHandshake, number: '04', title: 'Get it back', description: 'Connect with the finder or owner and arrange a safe hand-off.' },
]

export default function Home() {
  const { items, ready, stats } = useApp()
  const visible = items.filter((item) => item.status !== 'closed')
  const latest = [...visible].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
  const recovered = stats?.itemsRecovered ?? items.filter((item) => item.status === 'recovered').length
  const active = stats?.activeListings ?? items.filter((item) => ['active', 'claim_pending'].includes(item.status)).length

  return <div className="home-page">
    <section className="home-hero"><div className="home-container home-hero__inner">
      <div className="home-hero__copy"><span className="home-kicker"><Sparkles size={15} /> A little campus kindness goes a long way</span><h1>Lost something on campus?<br /><em>Let's bring it back.</em></h1><p>Campus Loop connects the people who find things with the people who are looking for them. Your next search might be one click away.</p><div className="home-hero__actions"><Link className="button button--primary" to="/report-lost">Report a lost item <ArrowRight size={17} /></Link><Link className="button button--hero-secondary" to="/browse?type=found">Browse found items</Link></div><div className="home-community"><span className="home-community__avatars"><i>A</i><i>J</i><i>M</i></span><span>Made for a campus that looks out for each other</span></div></div>
      <div className="home-hero__visual" aria-label="Recent campus found item">
        <div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" />
        <div className="hero-note hero-note--top"><span className="hero-note__check"><CheckCircle2 size={17} /></span><span><strong>Found something?</strong><small>Help it find its way home.</small></span></div>
        <div className="hero-featured">{ready && items[0] ? <><ItemImage item={items[0]} className="hero-featured__image" /><div className="hero-featured__body"><span className="hero-featured__label">RECENTLY REPORTED</span><strong>{items[0].title}</strong><small><span>{items[0].location}</span><span className="hero-featured__dot" />Found on campus</small></div><Link to={`/item/${items[0].id}`} aria-label={`View ${items[0].title}`}><ArrowUpRight size={18} /></Link></> : <ItemCardSkeleton />}</div>
        <div className="hero-note hero-note--bottom"><span className="hero-note__people"><UsersRound size={18} /></span><span><strong>Campus community</strong><small>Better together, every day.</small></span><span className="hero-note__spark"><Sparkles size={15} /></span></div>
      </div>
    </div></section>

    <section className="home-stats" aria-label="Campus Loop demo statistics"><div className="home-container home-stats__inner"><div className="home-stats__intro"><span className="home-kicker home-kicker--small">COMMUNITY AT A GLANCE</span><p>Every listing is a chance<br />to reconnect.</p></div>
      <div className="home-stat"><span className="home-stat__icon home-stat__icon--blue"><ClipboardList size={19} /></span><div><strong>{ready ? (stats?.itemsReported ?? items.length) : '—'}</strong><span>Items reported</span></div></div>
      <div className="home-stat"><span className="home-stat__icon home-stat__icon--green"><HeartHandshake size={19} /></span><div><strong>{ready ? recovered : '—'}</strong><span>Items recovered</span></div></div>
      <div className="home-stat"><span className="home-stat__icon home-stat__icon--teal"><SearchCheck size={19} /></span><div><strong>{ready ? active : '—'}</strong><span>Active listings</span></div></div>
      <span className="home-demo-label">Live data</span></div></section>

    <section className="home-section home-recent"><div className="home-container"><div className="home-section__heading"><div><span className="home-kicker home-kicker--small">THE LATEST FROM CAMPUS</span><h2>Recently reported</h2><p>Fresh finds and recent searches from around the campus.</p></div><Link className="text-link" to="/browse">Explore all listings <ArrowUpRight size={16} /></Link></div>
      <div className="item-grid">{ready ? latest.map((item) => <ItemCard key={item.id} item={item} />) : Array.from({ length: 3 }, (_, index) => <ItemCardSkeleton key={index} />)}</div>
      {!ready && <span className="sr-only" role="status">Loading recent listings</span>}
    </div></section>

    <section className="home-section home-how" id="how-it-works"><div className="home-container"><div className="home-section__heading home-section__heading--center"><div><span className="home-kicker home-kicker--small">SIMPLE BY DESIGN</span><h2>Four steps to a happy reunion</h2><p>Lost and found works better when the whole campus joins in.</p></div></div>
      <div className="home-steps">{steps.map(({ icon: Icon, number, title, description }) => <article className="home-step" key={number}><div className="home-step__top"><span className="home-step__icon"><Icon size={22} /></span><span>{number}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div>
    </div></section>

    <section className="home-cta"><div className="home-container home-cta__inner"><div><span className="home-kicker home-kicker--light">GOOD THINGS COME FULL LOOP</span><h2>Found something? Be someone's favorite person today.</h2><p>Post a quick listing and give a lost belonging a better chance of getting home.</p></div><Link className="button button--cta" to="/report-found">Report a found item <ArrowRight size={17} /></Link></div></section>
  </div>
}
