import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, BookOpen, CheckCircle2, ClipboardList, HeartHandshake, Plus, RefreshCw } from 'lucide-react'
import DashboardSidebar from '../components/layout/DashboardSidebar.jsx'
import StatCard from '../components/StatCard.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { getMyProfile, getMyItems, getMyActivity } from '../services/userService.js'
import { getClaims } from '../services/claimService.js'
import { updateItemStatus } from '../services/itemService.js'
import { formatDate } from '../utils/formatDate.js'
import './Dashboard.css'

const blankStats = { totalItems: 0, lostItems: 0, foundItems: 0, pendingClaims: 0, recoveredItems: 0 }

export default function Dashboard() {
  const { user } = useApp()
  const { showToast } = useToast()
  const [active, setActive] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [nextProfile, nextItems, nextClaims, nextActivity] = await Promise.all([getMyProfile(), getMyItems(), getClaims(), getMyActivity()])
      setProfile(nextProfile); setItems(nextItems.items); setClaims(nextClaims); setActivity(nextActivity)
    } catch (loadError) { setError(loadError.message || 'Could not load your dashboard.'); showToast(loadError.message || 'Could not load your dashboard.', 'error') }
    finally { setLoading(false) }
  }, [showToast])
  useEffect(() => { load() }, [load])

  async function markItem(item, status) {
    setUpdatingId(item.id)
    try { await updateItemStatus(item.id, status); showToast(`Listing marked ${status}.`, 'success'); await load() }
    catch (updateError) { showToast(updateError.message || 'Could not update the listing.', 'error') }
    finally { setUpdatingId('') }
  }

  const stats = profile?.stats || blankStats
  const shownItems = active === 'lost' ? items.filter(item => item.type === 'lost') : items.filter(item => item.type === 'found')
  const title = ({ overview: 'Your overview', lost: 'My lost items', found: 'My found items', claims: 'My claims' })[active]

  function itemsTable(rows) {
    if (loading) return <div className="dashboard-loading" role="status"><span className="dashboard-spinner" />Loading your listings?</div>
    if (!rows.length) return <EmptyState title="No listings here yet" description="Reports you create will appear here, ready for you to manage." action={<Link className="button button--primary" to={active === 'found' ? '/report-found' : '/report-lost'}>Report an item</Link>} />
    return <div className="dashboard-table-scroll"><table className="dashboard-table"><thead><tr><th>Item</th><th>Location</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(item=><tr key={item.id}><td><Link to={`/item/${item.id}`}>{item.title}</Link></td><td>{item.location}</td><td>{formatDate(item.date)}</td><td><span className={`dashboard-status dashboard-status--${item.status}`}>{item.status.replace('_',' ')}</span></td><td><div className="dashboard-row-actions">{item.status !== 'recovered' && item.status !== 'closed' && <button type="button" disabled={updatingId===item.id} onClick={()=>markItem(item,'recovered')}>{updatingId===item.id?'Saving?':'Mark recovered'}</button>}{item.status !== 'closed' && <button type="button" disabled={updatingId===item.id} onClick={()=>markItem(item,'closed')}>Close</button>}</div></td></tr>)}</tbody></table></div>
  }

  function claimsTable(rows) {
    if (loading) return <div className="dashboard-loading" role="status"><span className="dashboard-spinner" />Loading your claims?</div>
    if (!rows.length) return <EmptyState title="No claims yet" description="Claims you submit for found items will appear here." action={<Link className="button button--secondary" to="/browse?type=found">Browse found items</Link>} />
    return <div className="dashboard-table-scroll"><table className="dashboard-table"><thead><tr><th>Item</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{rows.map(claim=><tr key={claim.id}><td>{claim.itemId?.title || claim.itemTitle || 'Claimed item'}</td><td>{formatDate(claim.createdAt)}</td><td><span className={`dashboard-status dashboard-status--${claim.status}`}>{claim.status}</span></td></tr>)}</tbody></table></div>
  }

  return <div className="dashboard-page"><DashboardSidebar active={active} onChange={setActive} /><main className="dashboard-content"><header className="dashboard-heading"><div><span className="eyebrow">STUDENT DASHBOARD</span><h1>{title}</h1><p>Welcome back, {user?.name || profile?.user?.name || 'student'}. Here?s what?s happening with your campus listings.</p></div><button className="button button--secondary" type="button" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button></header>
    {error ? <EmptyState title="Dashboard could not load" description={error} action={<button className="button button--secondary" onClick={load}>Try again</button>} /> : loading && !profile ? <div className="dashboard-loading" role="status"><span className="dashboard-spinner" />Loading your dashboard?</div> : <>{active==='overview' && <><section className="dashboard-stat-grid" aria-label="Your account statistics"><StatCard icon={ClipboardList} label="Total items" value={stats.totalItems} /><StatCard icon={Archive} label="Lost items" value={stats.lostItems} tone="red" /><StatCard icon={BookOpen} label="Found items" value={stats.foundItems} tone="green" /><StatCard icon={HeartHandshake} label="Pending claims" value={stats.pendingClaims} tone="gold" /><StatCard icon={CheckCircle2} label="Recovered items" value={stats.recoveredItems} tone="blue" /></section><div className="dashboard-two-column"><section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>Quick actions</h2><p>Share a report with your campus.</p></div></div><div className="dashboard-quick-actions"><Link className="button button--primary" to="/report-lost"><Plus size={16}/>Report lost item</Link><Link className="button button--secondary" to="/report-found"><Plus size={16}/>Report found item</Link></div></section><section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>Recent activity</h2><p>Your latest account updates.</p></div></div>{activity.length ? <ul className="dashboard-activity">{activity.slice(0,5).map(entry=><li key={entry.id}><span>{entry.message}</span><time>{formatDate(entry.createdAt)}</time></li>)}</ul> : <p className="dashboard-muted">No activity to show yet.</p>}</section></div><section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>Recent listings</h2><p>Your latest reports.</p></div><button className="dashboard-text-button" onClick={()=>setActive('lost')}>View my listings</button></div>{items.length ? items.slice(0,5).map(item=><div className="dashboard-recent-row" key={item.id}><Link to={`/item/${item.id}`}>{item.title}</Link><span className={`dashboard-status dashboard-status--${item.status}`}>{item.status.replace('_',' ')}</span></div>) : <p className="dashboard-muted">Your reports will appear here when you add one.</p>}</section></>}
    {active==='lost' && <section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>My lost items</h2><p>Update the status as soon as you recover or close a listing.</p></div><Link className="button button--primary" to="/report-lost"><Plus size={16}/>Report lost</Link></div>{itemsTable(shownItems)}</section>}
    {active==='found' && <section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>My found items</h2><p>Manage found belongings and their listing status.</p></div><Link className="button button--primary" to="/report-found"><Plus size={16}/>Report found</Link></div>{itemsTable(shownItems)}</section>}
    {active==='claims' && <section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>My claims</h2><p>Follow the review status of your submitted claims.</p></div></div>{claimsTable(claims)}</section>}</>}
  </main></div>
}
