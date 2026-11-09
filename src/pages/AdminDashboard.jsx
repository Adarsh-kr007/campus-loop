import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, CheckCircle2, ClipboardList, RefreshCw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardSidebar from '../components/layout/DashboardSidebar.jsx'
import StatCard from '../components/StatCard.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { getAdminStats } from '../services/statsService.js'
import { getAdminItemPage, updateAdminItemStatus } from '../services/itemService.js'
import { getClaims, updateClaimStatus } from '../services/claimService.js'
import { formatDate } from '../utils/formatDate.js'
import './Dashboard.css'

const statuses = ['active', 'recovered', 'closed']
export default function AdminDashboard() {
  const { showToast } = useToast()
  const [active, setActive] = useState('overview')
  const [stats, setStats] = useState(null)
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const itemTitles = useMemo(() => new Map(items.map(item => [item.id, item.title])), [items])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [nextStats, itemPage, nextClaims] = await Promise.all([getAdminStats(), getAdminItemPage({ limit: 50 }), getClaims(true)])
      setStats(nextStats); setItems(itemPage.items); setClaims(nextClaims)
    } catch (loadError) { setError(loadError.message || 'Could not load the admin dashboard.'); showToast(loadError.message || 'Could not load admin data.', 'error') }
    finally { setLoading(false) }
  }, [showToast])
  useEffect(() => { load() }, [load])

  async function changeItem(item, status) {
    if (status === item.status) return
    if (!window.confirm(`Change ?${item.title}? to ${status.replace('_',' ')}?`)) return
    setBusyId(item.id)
    try { await updateAdminItemStatus(item.id, status); showToast('Listing status updated.', 'success'); await load() }
    catch (changeError) { showToast(changeError.message || 'Could not update listing.', 'error') }
    finally { setBusyId('') }
  }

  async function decideClaim(claim, status) {
    const itemName = claim.item?.title || itemTitles.get(claim.itemId) || 'this listing'
    if (!window.confirm(`${status === 'approved' ? 'Approve' : 'Reject'} the claim for ${itemName}?`)) return
    setBusyId(claim.id)
    try { await updateClaimStatus(claim.id, status); showToast(`Claim ${status}.`, 'success'); await load() }
    catch (changeError) { showToast(changeError.message || 'Could not update claim.', 'error') }
    finally { setBusyId('') }
  }

  function listingsTable() {
    if (loading) return <div className="dashboard-loading" role="status"><span className="dashboard-spinner" />Loading all listings?</div>
    if (!items.length) return <EmptyState title="No listings yet" description="Campus listings will appear here when students report items." />
    return <div className="dashboard-table-scroll"><table className="dashboard-table"><thead><tr><th>Listing</th><th>Type</th><th>Category</th><th>Location</th><th>Reported</th><th>Status</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><Link to={`/item/${item.id}`}>{item.title}</Link><small className="admin-table-subline">{item.contactName || item.postedBy?.name || 'Campus community member'}</small></td><td className="capitalize">{item.type}</td><td>{item.category}</td><td>{item.location}</td><td>{formatDate(item.createdAt || item.date)}</td><td><select className="admin-status-select" aria-label={`Change status for ${item.title}`} value={item.status} disabled={busyId===item.id} onChange={event=>changeItem(item,event.target.value)}>{item.status==='claim_pending'&&<option value="claim_pending" disabled>claim pending</option>}{statuses.map(status=><option key={status} value={status}>{status.replace('_',' ')}</option>)}</select></td></tr>)}</tbody></table></div>
  }

  function claimsTable() {
    if (loading) return <div className="dashboard-loading" role="status"><span className="dashboard-spinner" />Loading claims?</div>
    if (!claims.length) return <EmptyState title="No claims to review" description="Claims submitted by students will appear here." />
    return <div className="dashboard-table-scroll"><table className="dashboard-table"><thead><tr><th>Item</th><th>Claimant</th><th>Submitted</th><th>Status</th><th>Decision</th></tr></thead><tbody>{claims.map(claim=>{const itemName=claim.item?.title||itemTitles.get(claim.itemId)||'Claimed item';const claimant=claim.createdBy?.name||claim.claimantName||claim.claimantEmail||'Student';return <tr key={claim.id}><td>{itemName}</td><td>{claimant}</td><td>{formatDate(claim.createdAt)}</td><td><span className={`dashboard-status dashboard-status--${claim.status}`}>{claim.status}</span></td><td>{claim.status==='pending'?<div className="dashboard-row-actions"><button type="button" disabled={busyId===claim.id} onClick={()=>decideClaim(claim,'approved')}>Approve</button><button type="button" disabled={busyId===claim.id} onClick={()=>decideClaim(claim,'rejected')}>Reject</button></div>:<span className="dashboard-muted">Decided</span>}</td></tr>})}</tbody></table></div>
  }

  return <div className="dashboard-page"><DashboardSidebar admin active={active} onChange={setActive} /><main className="dashboard-content"><header className="dashboard-heading"><div><span className="eyebrow">CAMPUS LOOP ADMIN</span><h1>{active==='listings'?'Recent listings':active==='claims'?'Claims':'Admin dashboard'}</h1><p>Review reports, keep listings current, and help return items to their owners.</p></div><button className="button button--secondary" type="button" onClick={load} disabled={loading}><RefreshCw size={16}/>Refresh</button></header>
  {error&&<div className="dashboard-inline-error" role="alert">{error}<button type="button" onClick={load}>Try again</button></div>}
  {active==='overview'&&<><section className="dashboard-stat-grid admin-stat-grid" aria-label="Campus statistics"><StatCard icon={ClipboardList} label="Total reported" value={stats?.totalReported} /><StatCard icon={Archive} label="Total found" value={stats?.totalFound} tone="green" /><StatCard icon={Users} label="Pending claims" value={stats?.pendingClaims} tone="gold" /><StatCard icon={CheckCircle2} label="Recovered items" value={stats?.recoveredItems} tone="blue" /></section><section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>Recent listings</h2><p>Latest reports from the campus community.</p></div><button className="dashboard-text-button" onClick={()=>setActive('listings')}>View all listings</button></div>{listingsTable()}</section><section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>Claims to review</h2><p>Confirm ownership details before making a decision.</p></div><button className="dashboard-text-button" onClick={()=>setActive('claims')}>View all claims</button></div>{claimsTable()}</section></>}
  {active==='listings'&&<section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>Recent listings</h2><p>Change each listing status with the menu in the final column.</p></div></div>{listingsTable()}</section>}
  {active==='claims'&&<section className="dashboard-panel"><div className="dashboard-panel__heading"><div><h2>Claims</h2><p>Approve or reject pending claims. A decision updates the listing state.</p></div></div>{claimsTable()}</section>}
  </main></div>
}
