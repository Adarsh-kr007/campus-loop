import './Skeleton.css'

export function Skeleton({ className = '' }) { return <span className={`skeleton ${className}`} aria-hidden="true" /> }

export function ItemCardSkeleton() {
  return <div className="item-skeleton"><Skeleton className="item-skeleton__image" /><div className="item-skeleton__body"><Skeleton className="item-skeleton__tag" /><Skeleton className="item-skeleton__title" /><Skeleton className="item-skeleton__line" /><Skeleton className="item-skeleton__line item-skeleton__line--short" /></div></div>
}
