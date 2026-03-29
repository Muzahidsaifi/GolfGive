'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, Heart, Zap, ArrowRight, Star } from 'lucide-react'

interface Charity {
  id: string
  name: string
  description: string
  is_featured: boolean
}

export default function SubscribePage() {
  const router = useRouter()
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [charityId, setCharityId] = useState('')
  const [charityPct, setCharityPct] = useState(10)
  const [charities, setCharities] = useState<Charity[]>([])
  const [loadingCharities, setLoadingCharities] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoadingCharities(true)
    fetch('/api/charities')
      .then(r => r.json())
      .then(j => {
        setCharities(j.data || [])
        setLoadingCharities(false)
      })
      .catch(() => {
        toast.error('Failed to load charities')
        setLoadingCharities(false)
      })
  }, [])

  async function handleSubscribe() {
    if (!charityId) {
      toast.error('Please select a charity first')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, charity_id: charityId, charity_percentage: charityPct }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else if (res.status === 401) {
        toast.error('Please login first')
        router.push('/auth/login')
      } else {
        toast.error(json.error || 'Something went wrong')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
    setLoading(false)
  }

  const plans = [
    { key: 'monthly', label: 'Monthly', price: '£9.99', period: '/month', badge: null, features: ['Monthly draw entry', 'Score tracking', 'Charity support', 'Cancel anytime'] },
    { key: 'yearly', label: 'Yearly', price: '£99.99', period: '/year', badge: 'Save 17%', features: ['Everything in monthly', '2 months free', 'Priority support', 'Early draw access'] },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #052e16 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'serif', fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(135deg, #22c55e, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GolfGive
            </span>
          </Link>
          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>Choose Your Plan</h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>Join thousands of golfers making a difference</p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {plans.map(p => (
            <div key={p.key} onClick={() => setPlan(p.key as any)} style={{ background: 'rgba(15,23,42,0.8)', border: plan === p.key ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: 'white', fontWeight: '600' }}>{p.label}</span>
                    {p.badge && <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '10px', padding: '2px 8px', borderRadius: '999px' }}>{p.badge}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>{p.price}</span>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>{p.period}</span>
                  </div>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: plan === p.key ? '2px solid #22c55e' : '2px solid #334155', background: plan === p.key ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {plan === p.key && <Check size={14} color="#020617" strokeWidth={3} />}
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
                    <Check size={12} color="#22c55e" />{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Charity Selection */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Heart size={20} color="#22c55e" />
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Choose Your Charity</h2>
          </div>

          {loadingCharities ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Loading charities...</p>
          ) : charities.length === 0 ? (
            <p style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>No charities found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {charities.map(charity => (
                <div
                  key={charity.id}
                  onClick={() => setCharityId(charity.id)}
                  style={{ padding: '16px', borderRadius: '12px', border: charityId === charity.id ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.08)', background: charityId === charity.id ? 'rgba(34,197,94,0.08)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>{charity.name}</span>
                      {charity.is_featured && <Star size={12} color="#fbbf24" fill="#fbbf24" />}
                    </div>
                    {charityId === charity.id && <Check size={16} color="#22c55e" />}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{charity.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ color: '#94a3b8', fontSize: '14px' }}>Charity Contribution</label>
              <div>
                <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '18px' }}>{charityPct}%</span>
                <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '8px' }}>(~£{((plan === 'yearly' ? 8.33 : 9.99) * charityPct / 100).toFixed(2)}/mo)</span>
              </div>
            </div>
            <input type="range" min={10} max={50} step={5} value={charityPct} onChange={e => setCharityPct(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#22c55e' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '12px', marginTop: '4px' }}>
              <span>10% (minimum)</span><span>50%</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Plan</span>
            <span style={{ color: 'white', fontWeight: '500', textTransform: 'capitalize' }}>{plan}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Charity</span>
            <span style={{ color: charityId ? '#22c55e' : '#ef4444', fontWeight: '500' }}>
              {charityId ? charities.find(c => c.id === charityId)?.name : '⚠️ Not selected'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: '#94a3b8' }}>Contribution</span>
            <span style={{ color: '#22c55e', fontWeight: '500' }}>{charityPct}%</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontWeight: '600' }}>Total</span>
            <span style={{ color: '#22c55e', fontSize: '24px', fontWeight: 'bold' }}>{plan === 'monthly' ? '£9.99/mo' : '£99.99/yr'}</span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading || !charityId}
          style={{ width: '100%', background: (!charityId || loading) ? '#166534' : 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: (!charityId || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: !charityId ? 0.6 : 1 }}
        >
          {loading ? <span style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <Zap size={18} />}
          {loading ? 'Redirecting...' : !charityId ? 'Select a charity to continue' : 'Subscribe & Start Playing'}
          {!loading && charityId && <ArrowRight size={16} />}
        </button>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '12px' }}>Secure payment via Stripe. Cancel anytime.</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}