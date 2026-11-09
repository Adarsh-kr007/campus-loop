import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '../components/common/Badge.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { ItemCardSkeleton } from '../components/common/Skeleton.jsx'
import ItemCard from '../components/items/ItemCard.jsx'
import ItemImage from '../components/items/ItemImage.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getItemById } from '../services/itemService.js'
import { useEffect, useState } from 'react'
import { formatDate } from '../utils/formatDate.js'
import './ItemDetails.css'

export default function ItemDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items } = useApp()
  const [item, setItem] = useState(() => items.find((entry) => entry.id === id) || null)
  const [loading, setLoading] = useState(!item)
  const [loadError, setLoadError] = useState('')
  useEffect(() => { let active = true; setLoading(true); getItemById(id).then(value => { if (active) setItem(value) }).catch(error => { if (active) setLoadError(error.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [id])
  if (loading) return <div className="details-loading"><ItemCardSkeleton /></div>
  if (!item) return <div className="details-not-found"><EmptyState title="Item not found" description={loadError || "This listing may have been removed or the link may be incorrect."} action={<Link className="button button--secondary" to="/browse"><ArrowLeft size={16} /> Back to listings</Link>} /></div>

  const related = items.filter((entry) => entry.id !== item.id && entry.category === item.category && entry.status !== 'closed').slice(0, 3)
  const recovered = item.status === 'recovered'
  const closed = item.status === 'closed'
  const canClaim = item.type === 'found' && ['active', 'claim_pending'].includes(item.status)
  const canFind = item.type === 'lost' && !recovered && !closed

  return <div className="details-page"><div className="details-container">
    <button className="details-back" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
    <div className="details-layout"><div className="details-main"><div className="details-image-wrap"><ItemImage item={item} className="details-image" /></div>
      <div className="details-title-row"><div><div className="details-badges"><Badge variant={item.type}>{item.type}</Badge><Badge variant={item.status}>{item.status.replace('_', ' ')}</Badge></div><h1>{item.title}</h1></div><span className="details-category">{item.category}</span></div>
      <section className="details-section"><h2>About this item</h2><p>{item.description}</p></section>
      <section className="details-info-grid"><div><span><MapPin size={16} /></span><div><small>Last seen at</small><strong>{item.location}</strong></div></div><div><span><CalendarDays size={16} /></span><div><small>{item.type === 'lost' ? 'Date lost' : 'Date found'}</small><strong>{formatDate(item.date)}</strong></div></div></section>
      <section className="details-section details-posted"><span className="details-avatar"><UserRound size={21} /></span><div><small>Posted by</small><strong>{item.postedBy?.name || item.contactName || 'Campus community member'}</strong></div><Badge variant="default">Campus community</Badge></section>
    </div>
    <aside className="details-sidebar"><div className="details-action-card"><span className="details-action-icon">{recovered ? <CheckCircle2 size={23} /> : <ShieldCheck size={23} />}</span><h2>{recovered ? 'This item is home' : closed ? 'This listing is closed' : canClaim ? 'Think this belongs to you?' : 'Recognize this item?'}</h2><p>{recovered ? 'The owner has marked this item as recovered.' : closed ? 'This listing is no longer active.' : canClaim ? 'Share a few details to help the finder verify it is yours.' : 'Help connect this listing with the person who is looking for it.'}</p>
      {recovered || closed ? <button className="button button--disabled" type="button" disabled>{recovered ? 'Recovered' : 'Listing closed'}</button> : canClaim ? <Link className="button button--primary details-action-button" to={`/claim/${item.id}`}>Claim item <ArrowRight size={16} /></Link> : canFind ? <Link className="button button--primary details-action-button" to="/report-found">I found this <ArrowRight size={16} /></Link> : null}
      </div><div className="details-contact-card"><h3>Contact information</h3><p>{item.contactEmail ? 'Use these details to arrange a safe hand-off on campus.' : 'Contact details are not available for this listing.'}</p>{item.contactName && <div className="details-contact"><span><UserRound size={16} /></span><div><small>Contact person</small><strong>{item.contactName}</strong></div></div>}{item.contactEmail && <a className="details-contact" href={`mailto:${item.contactEmail}`}><span><Mail size={16} /></span><div><small>Email</small><strong>{item.contactEmail}</strong></div></a>}{item.contactPhone && <a className="details-contact" href={`tel:${item.contactPhone}`}><span><Phone size={16} /></span><div><small>Phone</small><strong>{item.contactPhone}</strong></div></a>}</div></aside></div>
    {related.length > 0 && <section className="details-related"><div className="details-related__heading"><div><span className="browse-eyebrow">SIMILAR LISTINGS</span><h2>More in {item.category}</h2></div><Link className="text-link" to={`/browse?category=${encodeURIComponent(item.category)}`}>View all <ArrowRight size={15} /></Link></div><div className="item-grid">{related.map((entry) => <ItemCard key={entry.id} item={entry} />)}</div></section>}
  </div></div>
}
