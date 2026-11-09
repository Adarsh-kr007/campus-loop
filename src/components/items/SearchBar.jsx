import { Search, X } from 'lucide-react'
import './SearchBar.css'

export default function SearchBar({ value, onChange, onClear }) {
  return <label className="search-bar"><Search size={19} aria-hidden="true" /><span className="sr-only">Search by item, description, or location</span><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search items, places, or details" /><button type="button" aria-label="Clear search" onClick={onClear} disabled={!value}><X size={17} /></button></label>
}
