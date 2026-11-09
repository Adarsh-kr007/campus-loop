import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return <footer className="site-footer"><div className="footer-main">
    <div className="footer-brand"><Link className="brand" to="/"><span className="brand-mark">C</span><span>campus<span className="brand-accent">loop</span><small>LOST & FOUND NETWORK</small></span></Link><p>A little help from your campus community can bring the important things back.</p></div>
    <div className="footer-nav"><strong>Explore</strong><Link to="/browse">Browse items <ArrowUpRight size={14} /></Link><Link to="/report-lost">Report an item <ArrowUpRight size={14} /></Link><Link to="/#how-it-works">How it works <ArrowUpRight size={14} /></Link></div>
    <div className="footer-note"><strong>Made for campus life</strong><p>Keep your community connected, one found item at a time.</p><span className="demo-note">Demo project · Sample listings</span></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} Campus Loop</span><span>Built for the campus community</span></div></footer>
}
