'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Target, Plus, Trash2, Info } from 'lucide-react'

interface Score {
  id: string
  score: number
  played_at: string
}

export default function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ score: '', played_at: '' })

  useEffect(() => { fetchScores() }, [])

  async function fetchScores() {
    const res = await fetch('/api/scores')
    const json = await res.json()
    setScores(json.data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const scoreNum = parseInt(form.score)
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      toast.error('Score must be between 1 and 45')
      return
    }
    if (!form.played_at) {
      toast.error('Please select a date')
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: scoreNum, played_at: form.played_at }),
    })

    if (res.ok) {
      toast.success('Score added!')
      setForm({ score: '', played_at: '' })
      fetchScores()
    } else {
      const json = await res.json()
      toast.error(json.error || 'Failed to add score')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">My Scores</h1>
        <p className="text-dark-400">Enter your Stableford scores to participate in draws.</p>
      </div>

      {/* Info Banner */}
      <div className="glass-green rounded-xl p-4 flex gap-3 mb-8">
        <Info className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-brand-300 text-sm font-medium">Rolling 5-Score System</p>
          <p className="text-dark-400 text-sm mt-1">
            Only your latest 5 scores count. When you add a 6th score, the oldest is automatically removed.
            Your 5 scores are used as your draw entries each month.
          </p>
        </div>
      </div>

      {/* Score Slots Visual */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-white">Current Scores</h2>
          <span className={`badge ${scores.length === 5 ? 'badge-green' : 'badge-gold'}`}>
            {scores.length}/5 slots filled
          </span>
        </div>

        {loading ? (
          <div className="flex gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="score-ball shimmer" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {scores.map((s, i) => (
              <div key={s.id} className="text-center">
                <div className={`score-ball ${i === 0 ? 'winning' : ''}`}>{s.score}</div>
                <p className="text-dark-500 text-[10px] mt-1">
                  {new Date(s.played_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            ))}
            {[...Array(Math.max(0, 5 - scores.length))].map((_, i) => (
              <div key={`empty-${i}`} className="text-center">
                <div className="score-ball border-dashed border-dark-700 text-dark-700">—</div>
                <p className="text-dark-700 text-[10px] mt-1">Empty</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Score Form */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-bold mb-5">Add New Score</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">
              Stableford Score <span className="text-dark-500">(1–45)</span>
            </label>
            <input
              type="number"
              min={1}
              max={45}
              value={form.score}
              onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
              placeholder="e.g. 32"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">Date Played</label>
            <input
              type="date"
              value={form.played_at}
              onChange={e => setForm(f => ({ ...f, played_at: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {submitting ? 'Adding...' : 'Add Score'}
          </button>
        </form>

        {scores.length === 5 && (
          <p className="text-gold-400 text-xs text-center mt-3 flex items-center justify-center gap-1">
            <Info className="w-3 h-3" />
            Adding a new score will replace your oldest score ({scores[scores.length - 1]?.score} pts)
          </p>
        )}
      </div>
    </div>
  )
}
