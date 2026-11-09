import { ArrowUpRight, MapPin, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../common/Badge.jsx'
import ItemImage from './ItemImage.jsx'
import { formatDate } from '../../utils/formatDate.js'
import './ItemCard.css'

export default function ItemCard({ item }) {
  return <article className="item-card">
    <Link className="item-card__image-link" to={`/item/${item.id}`} aria-label={`View ${item.title}`}><ItemImage item={item} className="item-card__image" /></Link>
    <div className="item-card__body">
      <div className="item-card__meta"><Badge variant={item.status}>{item.status.replace('_', ' ')}</Badge><span className="item-card__category">{item.category}</span></div>
      <h3><Link to={`/item/${item.id}`}>{item.title}</Link></h3>
      <p className="item-card__description">{item.description}</p>
      <div className="item-card__details"><span><MapPin size={15} />{item.location}</span><span><CalendarDays size={15} />{formatDate(item.date)}</span></div>
      <Link className="item-card__link" to={`/item/${item.id}`}>View details <ArrowUpRight size={16} /></Link>
    </div>
  </article>
}
