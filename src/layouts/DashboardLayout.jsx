import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import './DashboardLayout.css'

export default function DashboardLayout() { return <><Navbar /><main className="dashboard-shell"><Outlet /></main></> }
