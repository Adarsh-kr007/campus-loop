import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/authService.js'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../hooks/useToast.jsx'
import './AuthPages.css'

export default function Register() {
  const [form,setForm]=useState({name:'',email:'',studentId:'',password:'',confirmPassword:''})
  const [errors,setErrors]=useState({})
  const [visible,setVisible]=useState({password:false,confirmPassword:false})
  const [busy,setBusy]=useState(false)
  const navigate=useNavigate()
  const {refresh}=useApp()
  const {showToast}=useToast()

  function validate(){
    const next={}
    if(!form.name.trim()) next.name='Enter your full name.'
    if(!form.email.trim()) next.email='Enter your campus email.'
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email='Enter a valid email address.'
    if(!form.studentId.trim()) next.studentId='Enter your student ID.'
    if(!form.password) next.password='Create a password.'
    else if(form.password.length<8) next.password='Use at least 8 characters.'
    if(!form.confirmPassword) next.confirmPassword='Confirm your password.'
    else if(form.confirmPassword!==form.password) next.confirmPassword='Passwords do not match.'
    setErrors(next);return Object.keys(next).length===0
  }
  async function submit(event){
    event.preventDefault();if(!validate())return;setBusy(true)
    try{const {confirmPassword,...details}=form;await register(details);await refresh();showToast('Your account is ready.', 'success');navigate('/dashboard',{replace:true})}
    catch(error){showToast(error.message||'Could not create your account.','error')}finally{setBusy(false)}
  }
  function fieldError(field){return errors[field]&&<span className="field-error" id={`register-${field}-error`}>{errors[field]}</span>}
  function passwordInput(field,label,autocomplete){return <><label htmlFor={`register-${field}`}>{label}</label><div className="password-field"><input id={`register-${field}`} type={visible[field]?'text':'password'} autoComplete={autocomplete} value={form[field]} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field]?`register-${field}-error`:undefined} onChange={event=>setForm({...form,[field]:event.target.value})}/><button type="button" aria-label={visible[field]?'Hide password':'Show password'} aria-pressed={visible[field]} onClick={()=>setVisible({...visible,[field]:!visible[field]})}>{visible[field]?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{fieldError(field)}</>}
  return <section className="auth-page"><form className="auth-card auth-card--register" onSubmit={submit} noValidate><span className="eyebrow">CAMPUS LOOP</span><h1>Join your campus</h1><p className="auth-card__intro">Create your student account.</p><div className="auth-fields">
    <label htmlFor="register-name">Full name</label><input id="register-name" autoComplete="name" value={form.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name?'register-name-error':undefined} onChange={event=>setForm({...form,name:event.target.value})}/>{fieldError('name')}
    <label htmlFor="register-email">Campus email</label><input id="register-email" type="email" autoComplete="email" value={form.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email?'register-email-error':undefined} onChange={event=>setForm({...form,email:event.target.value})}/>{fieldError('email')}
    <label htmlFor="register-student-id">Student ID</label><input id="register-student-id" value={form.studentId} aria-invalid={Boolean(errors.studentId)} aria-describedby={errors.studentId?'register-studentId-error':undefined} onChange={event=>setForm({...form,studentId:event.target.value})}/>{fieldError('studentId')}
    {passwordInput('password','Password','new-password')}{passwordInput('confirmPassword','Confirm password','new-password')}
    </div><button className="button button--primary auth-submit" disabled={busy}>{busy?'Creating account?':'Create account'}</button><p className="auth-card__foot">Already registered? <Link to="/login">Sign in</Link></p></form></section>
}
