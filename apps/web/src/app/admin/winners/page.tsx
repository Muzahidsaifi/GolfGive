'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trophy, CheckCircle, XCircle, DollarSign, ExternalLink } from 'lucide-react'

interface Winner {
  id: string
  match_type: string
  prize_amount: number
  verification_status: string
  payment_status: string
  proof_url?: string
  admin_notes?: string
  created_at: string
  profiles: { full_name: string; email: string }
  draws: { title: string; month: string }
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => { fetchWinners() }, [filter])

  async function fetchWinners() {
    setLoading(true)
    const res = await fetch(`/api/admin/winners${filter ? `?status=${filter}` : ''}`)
    const json = await res.json()
    setWinners(json.data || [])
    setLoading(false)
  }

  async function doAction(winnerId: string, action: string, notes?: string) {
    setProcessingId(winnerId)
    const res = await fetch('/api/admin/winners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId, action, admin_notes: notes }),
    })
    if (res.ok) {
      toast.success(
        action === 'approve' ? 'Winner approved — email sent!' :
        action === 'reject' ? 'Submission rejected' :
        'Marked as paid!'
      )
      fetchWinners()
    } else {
      toast.error('Action failed')
    }
    setProcessingId(null)
  }

  const filters = ['pending', 'approved', 'rejected']

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Winner Verification</h1>
        <p className="text-dark-400">Review proof submissions and manage prize payouts.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-brand-500 text-dark-950'
                : 'btn-ghost'
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === '' ? 'bg-brand-500 text-dark-950' : 'btn-ghost'
          }`}
        >
          All
        </button>
      </div>

      {/* Winners List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 card shimmer" />)}
        </div>
      ) : winners.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-10 h-10 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No {filter} winners found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map(winner => (
            <div key={winner.id} className="card p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-semibold">{winner.profiles?.full_name}</p>
                    <span className={`badge text-[10px] ${
                      winner.match_type === '5-match' ? 'badge-gold' : 'badge-green'
                    }`}>
                      {winner.match_type}
                    </span>
                    <span className={`badge text-[10px] ${
                      winner.verification_status === 'approved' ? 'badge-green' :
                      winner.verification_status === 'rejected' ? 'badge-red' :
                      'badge-gold'
                    }`}>
                      {winner.verification_status}
                    </span>
                  </div>
                  <p className="text-dark-400 text-sm">{winner.profiles?.email}</p>
                  <p className="text-dark-500 text-xs mt-1">
                    {winner.draws?.title} · {new Date(winner.created_at).toLocaleDateString('en-GB')}
                  </p>
                  <p className="text-gold-400 font-bold text-lg mt-2">
                    £{winner.prize_amount?.toFixed(2)}
                    {winner.payment_status === 'paid' && (
                      <span className="text-brand-400 text-sm ml-2 font-normal">✓ Paid</span>
                    )}
                  </p>
                  {winner.proof_url && (
                    <a
                      href={winner.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-400 text-sm mt-2 hover:text-brand-300"
                    >
                      <ExternalLink className="w-3 h-3" /> View Proof Screenshot
                    </a>
                  )}
                  {winner.admin_notes && (
                    <p className="text-dark-500 text-xs mt-2 italic">Note: {winner.admin_notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {winner.verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => doAction(winner.id, 'approve')}
                        disabled={processingId === winner.id}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Rejection reason (optional):')
                          doAction(winner.id, 'reject', notes || undefined)
                        }}
                        disabled={processingId === winner.id}
                        className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm flex items-center gap-1 transition-all"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                  {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                    <button
                      onClick={() => doAction(winner.id, 'mark_paid')}
                      disabled={processingId === winner.id}
                      className="btn-gold text-sm flex items-center gap-1"
                    >
                      <DollarSign className="w-3 h-3" /> Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
