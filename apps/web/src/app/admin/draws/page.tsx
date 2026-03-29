'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Dices, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Draw {
  id: string
  title: string
  month: string
  draw_date: string
  status: string
  logic: string
  winning_numbers: number[]
  jackpot_amount: number
  total_pool: number
  participant_count: number
}

interface Simulation {
  winningNumbers: number[]
  fiveMatchWinners: number
  fourMatchWinners: number
  threeMatchWinners: number
  prizePerFiveMatch: number
  prizePerFourMatch: number
  prizePerThreeMatch: number
  jackpotRolls: boolean
}

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [simDrawId, setSimDrawId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [newDraw, setNewDraw] = useState({
    title: '',
    month: '',
    draw_date: '',
    logic: 'random',
  })

  useEffect(() => { fetchDraws() }, [])

  async function fetchDraws() {
    const res = await fetch('/api/draws?status=upcoming')
    const json = await res.json()
    setDraws(json.data || [])
    const pubRes = await fetch('/api/draws?status=published')
    const pubJson = await pubRes.json()
    setDraws(d => [...d, ...(pubJson.data || [])])
    setLoading(false)
  }

  async function createDraw() {
    if (!newDraw.title || !newDraw.month || !newDraw.draw_date) {
      toast.error('Please fill all fields')
      return
    }
    setCreating(true)
    const res = await fetch('/api/draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...newDraw }),
    })
    if (res.ok) {
      toast.success('Draw created!')
      setNewDraw({ title: '', month: '', draw_date: '', logic: 'random' })
      fetchDraws()
    } else {
      toast.error('Failed to create draw')
    }
    setCreating(false)
  }

  async function runSimulation(drawId: string, logic: string) {
    setSimDrawId(drawId)
    const res = await fetch('/api/draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'simulate', drawId, logic }),
    })
    const json = await res.json()
    if (json.data) {
      setSimulation(json.data.simulation)
      toast.success('Simulation complete')
    } else {
      toast.error('Simulation failed')
    }
  }

  async function publishDraw(drawId: string, logic: string) {
    if (!confirm('Are you sure you want to publish this draw? This cannot be undone.')) return
    const res = await fetch('/api/draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', drawId, logic }),
    })
    const json = await res.json()
    if (json.data) {
      toast.success('Draw published! Winners have been notified.')
      fetchDraws()
      setSimulation(null)
    } else {
      toast.error('Failed to publish draw')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Draw Management</h1>
        <p className="text-dark-400">Create, simulate, and publish monthly draws.</p>
      </div>

      {/* Create New Draw */}
      <div className="card p-6 mb-8">
        <h2 className="font-display text-xl font-bold mb-5">Create New Draw</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">Draw Title</label>
            <input
              className="input"
              placeholder="e.g. June 2025 Draw"
              value={newDraw.title}
              onChange={e => setNewDraw(d => ({ ...d, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-2">Month (YYYY-MM)</label>
            <input
              className="input"
              placeholder="2025-06"
              value={newDraw.month}
              onChange={e => setNewDraw(d => ({ ...d, month: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-2">Draw Date</label>
            <input
              type="date"
              className="input"
              value={newDraw.draw_date}
              onChange={e => setNewDraw(d => ({ ...d, draw_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-2">Draw Logic</label>
            <select
              className="input"
              value={newDraw.logic}
              onChange={e => setNewDraw(d => ({ ...d, logic: e.target.value }))}
            >
              <option value="random">Random (Standard Lottery)</option>
              <option value="algorithmic">Algorithmic (Frequency-Weighted)</option>
            </select>
          </div>
        </div>
        <button
          onClick={createDraw}
          disabled={creating}
          className="btn-primary flex items-center gap-2"
        >
          <Dices className="w-4 h-4" />
          {creating ? 'Creating...' : 'Create Draw'}
        </button>
      </div>

      {/* Simulation Result */}
      {simulation && (
        <div className="glass-gold rounded-2xl p-6 mb-8">
          <h3 className="font-display text-xl font-bold mb-4 text-gold-300">Simulation Result</h3>
          <div className="flex gap-3 mb-5">
            {simulation.winningNumbers.map((n, i) => (
              <div key={i} className="score-ball winning text-sm">{n}</div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: '5-Match Winners', value: simulation.fiveMatchWinners, prize: simulation.prizePerFiveMatch },
              { label: '4-Match Winners', value: simulation.fourMatchWinners, prize: simulation.prizePerFourMatch },
              { label: '3-Match Winners', value: simulation.threeMatchWinners, prize: simulation.prizePerThreeMatch },
            ].map((row, i) => (
              <div key={i} className="glass rounded-xl p-4 text-center">
                <p className="text-dark-400 text-xs mb-1">{row.label}</p>
                <p className="text-white font-bold text-2xl">{row.value}</p>
                <p className="text-gold-400 text-xs mt-1">£{row.prize.toFixed(2)} each</p>
              </div>
            ))}
          </div>
          {simulation.jackpotRolls && (
            <div className="flex items-center gap-2 text-gold-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              No 5-match winner — jackpot will roll over to next month
            </div>
          )}
          <button
            onClick={() => simDrawId && publishDraw(simDrawId, 'random')}
            className="btn-gold flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Publish This Draw
          </button>
        </div>
      )}

      {/* Draws List */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-5">All Draws</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-10">
            <Dices className="w-8 h-8 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No draws yet. Create the first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {draws.map(draw => (
              <div key={draw.id} className="border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-semibold">{draw.title}</p>
                    <span className={`badge text-[10px] ${draw.status === 'published' ? 'badge-green' : 'badge-gold'}`}>
                      {draw.status}
                    </span>
                  </div>
                  <p className="text-dark-500 text-xs">
                    {new Date(draw.draw_date).toLocaleDateString('en-GB')} ·
                    {draw.participant_count || 0} participants ·
                    Pool: £{(draw.total_pool || 0).toFixed(2)}
                  </p>
                  {draw.winning_numbers?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {draw.winning_numbers.map((n, i) => (
                        <span key={i} className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-[10px] flex items-center justify-center font-mono">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {draw.status === 'upcoming' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => runSimulation(draw.id, draw.logic)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Simulate
                    </button>
                    <button
                      onClick={() => publishDraw(draw.id, draw.logic)}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Publish
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
