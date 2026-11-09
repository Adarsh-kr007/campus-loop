import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import RouteStub from './pages/RouteStub.jsx'
import Home from './pages/Home.jsx'
import BrowseItems from './pages/BrowseItems.jsx'
import ItemDetails from './pages/ItemDetails.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ReportLost from './pages/ReportLost.jsx'
import ReportFound from './pages/ReportFound.jsx'
import ClaimItem from './pages/ClaimItem.jsx'

const stub = (title, description) => <RouteStub title={title} description={description} />

export const router = createBrowserRouter([
  { element: <MainLayout />, children: [
    { path: '/', element: <Home /> },
    { path: '/browse', element: <BrowseItems /> },
    { path: '/item/:id', element: <ItemDetails /> },
    { element: <ProtectedRoute />, children: [
      { path: '/report-lost', element: <ReportLost /> },
      { path: '/report-found', element: <ReportFound /> },
      { path: '/claim/:id', element: <ClaimItem /> },
    ] },
    { path: '*', element: stub('Page not found', 'The page you are looking for may have moved or does not exist.') },
  ] },
  { element: <AuthLayout />, children: [
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
  ] },
  { element: <ProtectedRoute />, children: [{ element: <DashboardLayout />, children: [
    { path: '/dashboard', element: <Dashboard /> },
  ] }] },
  { element: <ProtectedRoute adminOnly />, children: [{ element: <DashboardLayout />, children: [
    { path: '/admin', element: <AdminDashboard /> },
  ] }] },
])
