import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CircleUserRound, Menu, X } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { logout as endSession } from '../../services/authService.js'
import './Navbar.css'

export default function Navbar() {
  const { user, dispatch, refresh } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  async function handleLogout() {
    try { await endSession() } finally {
      dispatch({ type: 'user', value: null })
      setOpen(false)
      await refresh()
      navigate('/')
    }
  }
  const close = () => setOpen(false)
  return <header className="site-header">
    <div className="nav-shell">
      <Link className="brand" to="/" onClick={close}><span className="brand-mark">C</span><span>campus<span className="brand-accent">loop</span><small>LOST & FOUND NETWORK</small></span></Link>
      <button className="menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={'nav-links' + (open ? ' nav-links--open' : '')} aria-label="Main navigation">
        <NavLink to="/" end onClick={close}>Home</NavLink><NavLink to="/browse" onClick={close}>Browse Items</NavLink><a href="/#how-it-works" onClick={close}>How It Works</a>
        {user ? <><NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>{user.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}<button className="nav-user" type="button" onClick={handleLogout}><CircleUserRound size={17} /> Log out</button></> : <><NavLink to="/login" onClick={close}>Log in</NavLink><Link className="button button--primary nav-cta" to="/register" onClick={close}>Get Started</Link></>}
      </nav>
    </div>
  </header>
}
