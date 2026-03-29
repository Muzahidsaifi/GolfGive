'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Heart, Check, ExternalLink } from 'lucide-react'

interface Charity {
  id: string
  name: string
  description: string
  website_url?: string
  is_featured: boolean
}

interface UserCharity {
  charity_id: string
  contribution_percentage: number
  charities: Charity
}

export default function DashboardCharityPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [userCharity, setUserCharity] = useState<UserCharity | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [percentage, setPercentage] = useState(10)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/charities').then(r => r.json()),
      fetch('/api/user/charity').then(r => r.json()),
    ]).then(([charitiesRes, userRes]) => {
      setCharities(charitiesRes.data || [])
      if (userRes.data) {
        setUserCharity(userRes.data)
        setSelectedId(userRes.data.charity_id)
        setPercentage(userRes.data.contribution_percentage)
      }
    })
  }, [])

  async function handleSave() {
    if (!selectedId) {
      toast.error('Please select a charity')
      return
    }
    setSaving(true)
    const res = await fetch('/api/user/charity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charity_id: selectedId, contribution_percentage: percentage }),
    })
    if (res.ok) {
      toast.success('Charity preferences saved!')
      const json = await res.json()
      setUserCharity(json.data)
    } else {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  const monthlyAmount = (9.99 * percentage / 100).toFixed(2)

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">My Charity</h1>
        <p className="text-dark-400">Choose who your subscription supports.</p>
      </div>

      {/* Current Selection Summary */}
      {userCharity && (
        <div className="glass-green rounded-2xl p-6 mb-8">
          <p className="text-brand-400 text-sm font-medium mb-1">Currently supporting</p>
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            {userCharity.charities?.name}
          </h2>
          <p className="text-dark-400 text-sm">
            You're donating <strong className="text-brand-400">{userCharity.contribution_percentage}%</strong> of your subscription — approximately{' '}
            <strong className="text-brand-400">
              £{(9.99 * userCharity.contribution_percentage / 100).toFixed(2)}/month
            </strong>
          </p>
        </div>
      )}

      {/* Charity Selection */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-xl font-bold mb-5">Select a Charity</h2>
        <div className="space-y-3">
          {charities.map(charity => (
            <button
              key={charity.id}
              onClick={() => setSelectedId(charity.id)}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                selectedId === charity.id
                  ? 'border-brand-500/50 bg-brand-500/5'
                  : 'border-white/8 hover:border-white/15 hover:bg-white/2'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedId === charity.id
                    ? 'bg-brand-500/20 border border-brand-500/30'
                    : 'bg-dark-800 border border-white/8'
                }`}>
                  <Heart className={`w-4 h-4 ${selectedId === charity.id ? 'text-brand-400' : 'text-dark-500'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{charity.name}</p>
                    {charity.is_featured && (
                      <span className="badge-gold text-[10px]">Featured</span>
                    )}
                  </div>
                  <p className="text-dark-500 text-xs mt-0.5 line-clamp-1">{charity.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {charity.website_url && (
                  <a
                    href={charity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-dark-600 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {selectedId === charity.id && (
                  <Check className="w-4 h-4 text-brand-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contribution % */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-xl font-bold mb-2">Contribution Amount</h2>
        <p className="text-dark-400 text-sm mb-5">
          Minimum 10%. You can choose to donate more.
        </p>
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-white font-bold text-2xl">{percentage}%</span>
            <span className="text-brand-400 text-sm">~£{monthlyAmount}/month</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={percentage}
            onChange={e => setPercentage(parseInt(e.target.value))}
            className="w-full accent-green-500"
          />
          <div className="flex justify-between text-xs text-dark-600 mt-1">
            <span>10% (minimum)</span>
            <span>50%</span>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 mt-4">
          {[10, 15, 20, 25, 30].map(pct => (
            <button
              key={pct}
              onClick={() => setPercentage(pct)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                percentage === pct
                  ? 'bg-brand-500 text-dark-950'
                  : 'border border-white/10 text-dark-400 hover:text-white hover:border-white/20'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !selectedId}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4"
      >
        {saving ? (
          <span className="animate-spin w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
        {saving ? 'Saving...' : 'Save Charity Preferences'}
      </button>
    </div>
  )
}
