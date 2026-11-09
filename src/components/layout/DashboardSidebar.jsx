import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, ClipboardList, FilePlus2, Menu, Shield, X } from 'lucide-react'
import './DashboardSidebar.css'

const studentLinks = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'lost', label: 'My Lost Items', icon: ClipboardList },
  { id: 'found', label: 'My Found Items', icon: ClipboardList },
  { id: 'claims', label: 'My Claims', icon: Shield },
]
const adminLinks = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'listings', label: 'Recent Listings', icon: ClipboardList },
  { id: 'claims', label: 'Claims', icon: Shield },
]

export default function DashboardSidebar({ admin = false, active, onChange }) {
  const [open, setOpen] = useState(false)
  const links = admin ? adminLinks : studentLinks
  function choose(id) { onChange(id); setOpen(false) }
  return <><button className="dashboard-menu-toggle" type="button" aria-expanded={open} aria-controls="dashboard-sidebar" onClick={() => setOpen(value => !value)}>{open ? <X size={18} /> : <Menu size={18} />}<span>{open ? 'Close menu' : 'Dashboard menu'}</span></button><button className={`dashboard-sidebar-scrim${open ? ' is-open' : ''}`} type="button" aria-label="Close dashboard menu" onClick={() => setOpen(false)} /><aside id="dashboard-sidebar" className={`dashboard-sidebar${open ? ' is-open' : ''}`}><div className="dashboard-sidebar__brand"><span className="dashboard-sidebar__mark">CL</span><span><strong>Campus Loop</strong><small>{admin ? 'Administration' : 'Student space'}</small></span></div><nav aria-label={admin ? 'Admin dashboard sections' : 'Student dashboard sections'}>{links.map(({id,label,icon:Icon})=><button key={id} type="button" className={`dashboard-sidebar__link${active===id?' is-active':''}`} aria-current={active===id?'page':undefined} onClick={()=>choose(id)}><Icon size={18} aria-hidden="true" />{label}</button>)}</nav><div className="dashboard-sidebar__bottom"><NavLink to={admin?'/browse':'/report-lost'} onClick={()=>setOpen(false)}><FilePlus2 size={17} />{admin?'Browse campus':'Report lost item'}</NavLink>{admin&&<NavLink to="/report-found" onClick={()=>setOpen(false)}><FilePlus2 size={17} />Report found item</NavLink>}</div></aside></>
}
