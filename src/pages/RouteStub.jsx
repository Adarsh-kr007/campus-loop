import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import './RouteStub.css'

export default function RouteStub({ title = 'Page', description = 'This page is part of a later build phase.' }) {
  return <section className="stub-page"><div className="stub-card"><span className="stub-icon"><Construction size={24} /></span><p className="eyebrow">CAMPUS LOOP · PHASE 1</p><h1>{title}</h1><p>{description}</p><span className="demo-pill">Demo Mode</span><Link className="button button--secondary" to="/browse"><ArrowLeft size={16} /> Browse demo listings</Link></div></section>
}
