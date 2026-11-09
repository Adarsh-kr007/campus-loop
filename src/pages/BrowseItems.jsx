import { useEffect, useState } from 'react'
import { SlidersHorizontal, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState.jsx'
import { ItemCardSkeleton } from '../components/common/Skeleton.jsx'
import FilterPanel from '../components/items/FilterPanel.jsx'
import ItemCard from '../components/items/ItemCard.jsx'
import SearchBar from '../components/items/SearchBar.jsx'
import useDebounce from '../hooks/useDebounce.js'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { getItemPage } from '../services/itemService.js'
import './BrowseItems.css'

const PARAMS = ['q', 'type', 'category', 'location', 'dateRange', 'date', 'dateMode', 'sort']

export default function BrowseItems() {
  const { ready } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryText = searchParams.get('q') || ''
  const queryString = searchParams.toString()
  const [search, setSearch] = useState(queryText)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const { showToast } = useToast()
  const filters = {
    type: searchParams.get('type') || 'all', category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    dateMode: searchParams.get('dateMode') || searchParams.get('dateRange') || (searchParams.get('date') ? 'custom' : ''),
    date: searchParams.get('date') || '', sort: searchParams.get('sort') || 'newest',
  }

  useEffect(() => setSearch(queryText), [queryText])
  useEffect(() => {
    if (debouncedSearch.trim() === queryText) return
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (debouncedSearch.trim()) next.set('q', debouncedSearch.trim())
      else next.delete('q')
      return next
    })
  }, [debouncedSearch, queryText, setSearchParams])

  useEffect(() => {
    if (!ready) return undefined
    let cancelled = false
    setLoading(true)
    setLoadError('')
    const url = new URLSearchParams(queryString)
    const params = { limit: 50 }
    ;['q', 'type', 'category', 'location', 'dateRange', 'date', 'sort'].forEach((key) => {
      const value = url.get(key)
      if (value && !(key === 'type' && value === 'all')) params[key] = value
    })
    getItemPage(params).then((result) => {
      if (!cancelled) { setItems(result.items); setTotal(result.pagination.total) }
    }).catch((error) => {
      if (!cancelled) { setLoadError(error.message); showToast(error.message, 'error') }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [queryString, ready, showToast])

  const updateParam = (key, value) => setSearchParams((current) => {
    const next = new URLSearchParams(current)
    if (value) next.set(key, value)
    else next.delete(key)
    return next
  })

  function updateFilter(key, value) {
    if (key === 'type') return updateParam('type', value === 'all' ? '' : value)
    if (key === 'dateMode') {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.delete('dateRange'); next.delete('date'); next.delete('dateMode')
        if (value === '7d' || value === '30d') next.set('dateRange', value)
        if (value === 'custom') next.set('dateMode', 'custom')
        return next
      })
      return
    }
    if (key === 'date') {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('dateMode', 'custom')
        if (value) next.set('date', value)
        else next.delete('date')
        return next
      })
      return
    }
    updateParam(key, value)
  }

  function clearFilters() {
    setSearch('')
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      PARAMS.forEach((key) => next.delete(key))
      return next
    })
  }

  const hasFilters = PARAMS.some((key) => searchParams.has(key))

  return <div className="browse-page"><div className="browse-container">
    <header className="browse-heading"><div><span className="browse-eyebrow"><Search size={14} /> CAMPUS LOST & FOUND</span><h1>Browse listings</h1><p>Search the campus network and see if your lost item has turned up.</p></div><span className="browse-demo"><span /> Live listings</span></header>
    <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} />
    <FilterPanel filters={filters} onChange={updateFilter} onClear={clearFilters} mobileOpen={mobileOpen} onToggle={() => setMobileOpen((open) => !open)} />
    <div className="browse-results-bar"><div><strong>{loading ? '—' : total}</strong><span>{total === 1 ? ' listing' : ' listings'} found</span></div><span className="browse-results-sort"><SlidersHorizontal size={15} /> {filters.sort === 'oldest' ? 'Oldest first' : 'Newest first'}</span></div>
    {loading ? <div className="item-grid">{[1, 2, 3, 4, 5, 6].map((key) => <ItemCardSkeleton key={key} />)}</div> : loadError ? <EmptyState title="Could not load listings" description={loadError} action={<button type="button" className="button button--secondary" onClick={() => window.location.reload()}>Retry</button>} /> : items.length ? <div className="item-grid">{items.map((item) => <ItemCard key={item.id} item={item} />)}</div> : <EmptyState title="No matching listings" description="Try a different search or clear some filters to see more campus listings." action={hasFilters && <button type="button" className="button button--secondary" onClick={clearFilters}>Clear search and filters</button>} />}
  </div></div>
}
