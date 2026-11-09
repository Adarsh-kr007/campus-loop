import { SearchX } from 'lucide-react'
import './EmptyState.css'

export default function EmptyState({ title = 'No items found', description = 'Try changing your search or filters.', action }) {
  return <div className="empty-state"><span className="empty-state__icon"><SearchX size={26} /></span><h2>{title}</h2><p>{description}</p>{action}</div>
}
