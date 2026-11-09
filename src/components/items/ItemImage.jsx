import { useState } from 'react'
import { BookOpen, BriefcaseBusiness, FileText, Shirt, Sparkles, Watch, Laptop } from 'lucide-react'
import './ItemImage.css'

const categoryIcons = { Electronics: Laptop, Bags: BriefcaseBusiness, Books: BookOpen, Documents: FileText, Accessories: Watch, Clothing: Shirt, Other: Sparkles }

export default function ItemImage({ item, className = '' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const Icon = categoryIcons[item.category] ?? Sparkles
  return <div className={`item-image item-image--${(item.category || 'other').toLowerCase()} ${className}`}>
    {item.imageUrl && !imageFailed ? <img src={item.imageUrl} alt={item.title} onError={() => setImageFailed(true)} /> : null}
    {(!item.imageUrl || imageFailed) && <><span className="item-image__orb" aria-hidden="true" /><Icon className="item-image__icon" size={54} strokeWidth={1.35} aria-hidden="true" /></>}
    <span className={`item-image__type item-image__type--${item.type}`}>{item.type === 'lost' ? 'Lost item' : 'Found item'}</span>
  </div>
}
