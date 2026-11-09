import { Filter, RotateCcw } from 'lucide-react'
import { CATEGORIES, LOCATIONS } from '../../data/constants.js'
import './FilterPanel.css'

export default function FilterPanel({ filters, onChange, onClear, mobileOpen, onToggle }) {
  return <section className={`filter-panel${mobileOpen ? ' filter-panel--open' : ''}`} aria-label="Listing filters">
    <div className="filter-panel__top"><h2><Filter size={17} /> Filters</h2><button type="button" className="filter-clear" onClick={onClear}><RotateCcw size={14} /> Clear all</button><button type="button" className="filter-toggle" onClick={onToggle} aria-expanded={mobileOpen} aria-controls="filter-options"><Filter size={17} /> Filters</button></div>
    <div id="filter-options" className="filter-panel__fields">
      <fieldset className="filter-type"><legend>Listing type</legend><div className="filter-segment">
        {[['all', 'All'], ['lost', 'Lost'], ['found', 'Found']].map(([value, label]) => <button type="button" key={value} className={filters.type === value ? 'is-selected' : ''} aria-pressed={filters.type === value} onClick={() => onChange('type', value)}>{label}</button>)}
      </div></fieldset>
      <label className="filter-field"><span>Category</span><select value={filters.category} onChange={(event) => onChange('category', event.target.value)}><option value="">All categories</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="filter-field"><span>Location</span><select value={filters.location} onChange={(event) => onChange('location', event.target.value)}><option value="">All locations</option>{LOCATIONS.map((location) => <option key={location}>{location}</option>)}</select></label>
      <label className="filter-field"><span>Date reported</span><select value={filters.dateMode} onChange={(event) => onChange('dateMode', event.target.value)}><option value="">Any time</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="custom">Choose a date</option></select></label>
      {filters.dateMode === 'custom' && <label className="filter-field"><span>Exact date</span><input type="date" value={filters.date} max={new Date().toISOString().slice(0, 10)} onChange={(event) => onChange('date', event.target.value)} /></label>}
      <label className="filter-field"><span>Sort by</span><select value={filters.sort} onChange={(event) => onChange('sort', event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
    </div>
  </section>
}
