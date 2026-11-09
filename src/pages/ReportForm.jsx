import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { createItem } from '../services/itemService.js'
import { CATEGORIES, LOCATIONS } from '../data/constants.js'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../hooks/useToast.jsx'
import './FormPages.css'

export default function ReportForm({ type }) {
  const today = useMemo(() => new Date().toISOString().slice(0,10), [])
  const { user, refresh } = useApp()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form,setForm]=useState({title:'',description:'',category:'Other',location:'Library',date:today,contactName:user?.name||'',contactEmail:user?.email||'',contactPhone:''})
  const [preview,setPreview]=useState('')
  const [errors,setErrors]=useState({})
  const [busy,setBusy]=useState(false)
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview])

  function update(field,value){setForm(current=>({...current,[field]:value}));setErrors(current=>({...current,[field]:''}))}
  function chooseImage(file){
    if(preview)URL.revokeObjectURL(preview)
    setPreview('')
    if(!file)return
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setErrors(current=>({...current,image:'Choose a JPG, PNG, or WebP image.'}));return}
    if(file.size>5*1024*1024){setErrors(current=>({...current,image:'Choose an image smaller than 5 MB.'}));return}
    setErrors(current=>({...current,image:''}));setPreview(URL.createObjectURL(file))
  }
  function validate(){
    const next={}
    if(!form.title.trim())next.title='Enter an item name.'
    if(form.description.trim().length<20)next.description='Add at least 20 characters of detail.'
    if(!form.location)next.location='Choose a campus location.'
    if(!form.date)next.date='Choose the date you lost or found it.'
    else if(form.date>today)next.date='Date cannot be in the future.'
    if(!form.contactName.trim())next.contactName='Enter a contact name.'
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))next.contactEmail='Enter a valid contact email.'
    setErrors(next);return Object.keys(next).length===0
  }
  async function submit(event){
    event.preventDefault();if(!validate())return;setBusy(true)
    try{
      const item=await createItem({...form,type,imageUrl:null,contactPhone:form.contactPhone||undefined})
      showToast('Your report has been submitted.','success')
      await refresh()
      navigate(item?.id?`/item/${item.id}`:'/browse')
    }catch(error){
      if(error.errors?.length){const mapped=Object.fromEntries(error.errors.map(entry=>[entry.field,entry.message]));setErrors(current=>({...current,...mapped}))}
      showToast(error.message||'Could not submit the report.','error')
    }finally{setBusy(false)}
  }
  function fieldError(field){return errors[field]&&<span className="field-error" id={`report-${field}-error`}>{errors[field]}</span>}
  return <section className="form-page"><div className="form-page__heading"><span className="eyebrow">CAMPUS LOST & FOUND</span><h1>Report a {type} item</h1><p>Share a few details so your campus community can help.</p></div><form className="form-card report-form" onSubmit={submit} noValidate><div className="form-grid">
    <div className="form-field form-field--wide"><label htmlFor="report-title">Item name</label><input id="report-title" maxLength="100" value={form.title} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title?'report-title-error':undefined} onChange={event=>update('title',event.target.value)}/>{fieldError('title')}</div>
    <div className="form-field"><label htmlFor="report-category">Category</label><select id="report-category" value={form.category} onChange={event=>update('category',event.target.value)}>{CATEGORIES.map(value=><option key={value}>{value}</option>)}</select></div>
    <div className="form-field"><label htmlFor="report-location">Campus location</label><select id="report-location" value={form.location} aria-invalid={Boolean(errors.location)} aria-describedby={errors.location?'report-location-error':undefined} onChange={event=>update('location',event.target.value)}>{LOCATIONS.map(value=><option key={value}>{value}</option>)}</select>{fieldError('location')}</div>
    <div className="form-field form-field--wide"><label htmlFor="report-description">Description</label><textarea id="report-description" minLength="20" maxLength="1000" rows="4" value={form.description} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description?'report-description-error':undefined} onChange={event=>update('description',event.target.value)}/><span className="field-hint">Add identifying details that will help someone recognize it.</span>{fieldError('description')}</div>
    <div className="form-field"><label htmlFor="report-date">Date {type}</label><input id="report-date" type="date" max={today} value={form.date} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date?'report-date-error':undefined} onChange={event=>update('date',event.target.value)}/>{fieldError('date')}</div>
    <div className="form-field"><label htmlFor="report-contact-name">Contact name</label><input id="report-contact-name" value={form.contactName} aria-invalid={Boolean(errors.contactName)} aria-describedby={errors.contactName?'report-contactName-error':undefined} onChange={event=>update('contactName',event.target.value)}/>{fieldError('contactName')}</div>
    <div className="form-field"><label htmlFor="report-contact-email">Contact email</label><input id="report-contact-email" type="email" value={form.contactEmail} aria-invalid={Boolean(errors.contactEmail)} aria-describedby={errors.contactEmail?'report-contactEmail-error':undefined} onChange={event=>update('contactEmail',event.target.value)}/>{fieldError('contactEmail')}</div>
    <div className="form-field"><label htmlFor="report-contact-phone">Phone <span className="field-hint-inline">(optional)</span></label><input id="report-contact-phone" type="tel" value={form.contactPhone} onChange={event=>update('contactPhone',event.target.value)}/></div>
    <div className="form-field form-field--wide"><label htmlFor="report-image">Item photo</label><label className="image-picker" htmlFor="report-image"><ImagePlus size={19}/><span>Choose a JPG, PNG, or WebP image (up to 5 MB)</span></label><input className="visually-hidden-input" id="report-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>chooseImage(event.target.files?.[0])}/><p className="field-hint">Image upload is not available yet. This preview stays in your browser and the API receives imageUrl as null.</p>{fieldError('image')}{preview&&<div className="image-preview"><img src={preview} alt="Preview of the selected item"/><button type="button" aria-label="Remove selected image" onClick={()=>{URL.revokeObjectURL(preview);setPreview('');document.getElementById('report-image').value=''}}> <X size={16}/> Remove image</button></div>}</div>
    </div><div className="form-actions"><Link className="button button--secondary" to="/browse">Cancel</Link><button className="button button--primary" disabled={busy}>{busy?'Submitting report?':'Submit report'}</button></div></form></section>
}
