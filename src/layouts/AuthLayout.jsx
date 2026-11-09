import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AuthLayout.css'

export default function AuthLayout() { return <main className="auth-layout"><div className="auth-top"><Link to="/" className="brand"><span className="brand-mark">C</span><span>campus<span className="brand-accent">loop</span><small>LOST & FOUND NETWORK</small></span></Link><Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to home</Link></div><Outlet /></main> }
