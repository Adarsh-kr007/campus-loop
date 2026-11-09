import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/authService.js'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../hooks/useToast.jsx'
import './AuthPages.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useApp()
  const { showToast } = useToast()

  function validate() {
    const next = {}
    if (!form.email.trim()) next.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(event) {
    event.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      const user = await login(form)
      await refresh()
      showToast('You are signed in.', 'success')
      navigate(location.state?.from?.pathname || (user?.role === 'admin' ? '/admin' : '/dashboard'), { replace: true })
    } catch (error) { showToast(error.message || 'Could not sign in.', 'error') }
    finally { setBusy(false) }
  }

  return <section className="auth-page"><form className="auth-card" onSubmit={submit} noValidate><span className="eyebrow">CAMPUS LOOP</span><h1>Welcome back</h1><p className="auth-card__intro">Sign in with your campus account.</p><div className="auth-fields">
    <label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" value={form.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email?'login-email-error':undefined} onChange={event=>setForm({...form,email:event.target.value})}/>{errors.email&&<span className="field-error" id="login-email-error">{errors.email}</span>}
    <div className="auth-label-row"><label htmlFor="login-password">Password</label><button type="button" className="auth-link-button" onClick={()=>showToast('Password recovery is not available yet.', 'info')}>Forgot password?</button></div><div className="password-field"><input id="login-password" type={passwordVisible?'text':'password'} autoComplete="current-password" value={form.password} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password?'login-password-error':undefined} onChange={event=>setForm({...form,password:event.target.value})}/><button type="button" aria-label={passwordVisible?'Hide password':'Show password'} aria-pressed={passwordVisible} onClick={()=>setPasswordVisible(value=>!value)}>{passwordVisible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{errors.password&&<span className="field-error" id="login-password-error">{errors.password}</span>}
    <label className="remember-control"><input type="checkbox" checked={form.remember} onChange={event=>setForm({...form,remember:event.target.checked})}/><span>Remember me on this device</span></label>
    </div><button className="button button--primary auth-submit" disabled={busy}>{busy?'Signing in?':'Sign in'}</button><p className="auth-card__foot">New to Campus Loop? <Link to="/register">Create an account</Link></p></form></section>
}
