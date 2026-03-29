'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Heart, Plus, Edit, Trash2, Star, Globe, X } from 'lucide-react'

interface Charity {
  id: string
  name: string
  slug: string
  description: string
  website_url?: string
  is_featured: boolean
  is_active: boolean
  total_raised: number
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const emptyForm = { name: '', description: '', website_url: '', is_featured: false }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchCharities() }, [])

  async function fetchCharities() {
    const res = await fetch('/api/charities?all=true')
    const json = await res.json()
    setCharities(json.data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const url = editingId ? `/api/charities/${editingId}` : '/api/charities'
    const method = editingId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      toast.success(editingId ? 'Charity updated!' : 'Charity added!')
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchCharities()
    } else {
      toast.error('Failed to save charity')
    }
    setSubmitting(false)
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/charities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (res.ok) {
      toast.success(`Charity ${current ? 'deactivated' : 'activated'}`)
      fetchCharities()
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    const res = await fetch(`/api/charities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !current }),
    })
    if (res.ok) {
      toast.success(`Featured status updated`)
      fetchCharities()
    }
  }

  function startEdit(charity: Charity) {
    setForm({
      name: charity.name,
      description: charity.description,
      website_url: charity.website_url || '',
      is_featured: charity.is_featured,
    })
    setEditingId(charity.id)
    setShowForm(true)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Charities</h1>
          <p className="text-dark-400">Manage charity listings and featured selections.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Charity
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-6 mb-8 border-brand-500/20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">
              {editingId ? 'Edit Charity' : 'Add New Charity'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-dark-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">Charity Name</label>
              <input
                className="input"
                placeholder="e.g. Macmillan Cancer Support"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">Description</label>
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder="Brief description of the charity's mission..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">Website URL (optional)</label>
              <input
                type="url"
                className="input"
                placeholder="https://www.charity.org"
                value={form.website_url}
                onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                className="w-4 h-4 accent-green-500"
              />
              <span className="text-dark-300 text-sm">Feature on homepage</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full" />
                ) : editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Charity'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Charities List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24 shimmer" />)}
        </div>
      ) : charities.length === 0 ? (
        <div className="card p-16 text-center">
          <Heart className="w-10 h-10 text-dark-700 mx-auto mb-4" />
          <p className="text-dark-400">No charities yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {charities.map(charity => (
            <div key={charity.id} className={`card p-5 flex items-center justify-between gap-4 ${!charity.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl glass-green flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-brand-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold truncate">{charity.name}</p>
                    {charity.is_featured && <Star className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />}
                    {!charity.is_active && <span className="badge-red text-[10px]">Inactive</span>}
                  </div>
                  <p className="text-dark-500 text-xs truncate">{charity.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {charity.website_url && (
                  <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                     className="text-dark-500 hover:text-white transition-colors p-2">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => toggleFeatured(charity.id, charity.is_featured)}
                  className={`p-2 transition-colors ${charity.is_featured ? 'text-gold-400' : 'text-dark-600 hover:text-gold-400'}`}
                  title="Toggle featured"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startEdit(charity)}
                  className="text-dark-500 hover:text-white transition-colors p-2"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(charity.id, charity.is_active)}
                  className={`p-2 transition-colors ${charity.is_active ? 'text-brand-400 hover:text-red-400' : 'text-dark-600 hover:text-brand-400'}`}
                  title={charity.is_active ? 'Deactivate' : 'Activate'}
                >
                  {charity.is_active
                    ? <X className="w-4 h-4" />
                    : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
