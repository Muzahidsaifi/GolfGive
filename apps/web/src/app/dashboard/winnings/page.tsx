import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Upload, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'

export const metadata = { title: 'My Winnings' }

export default async function WinningsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: winners } = await supabase
    .from('winners')
    .select('*, draws(title, month, winning_numbers)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalWon = winners?.reduce((s, w) => s + w.prize_amount, 0) || 0
  const totalPaid = winners?.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0) || 0
  const pending = winners?.filter(w => w.verification_status === 'pending').length || 0

  const statusIcon = (v: string, p: string) => {
    if (p === 'paid') return <CheckCircle className="w-4 h-4 text-brand-400" />
    if (v === 'approved') return <DollarSign className="w-4 h-4 text-gold-400" />
    if (v === 'rejected') return <XCircle className="w-4 h-4 text-red-400" />
    return <Clock className="w-4 h-4 text-gold-400" />
  }

  const statusLabel = (v: string, p: string) => {
    if (p === 'paid') return 'Paid'
    if (v === 'approved') return 'Payment pending'
    if (v === 'rejected') return 'Rejected'
    return 'Awaiting verification'
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">My Winnings</h1>
        <p className="text-dark-400">Track your prizes and verification status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Won', value: `£${totalWon.toFixed(2)}`, color: 'gold' },
          { label: 'Total Paid', value: `£${totalPaid.toFixed(2)}`, color: 'green' },
          { label: 'Pending', value: `${pending}`, color: 'gray' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <p className="text-dark-400 text-xs mb-1">{s.label}</p>
            <p className={`font-display text-2xl font-bold ${
              s.color === 'gold' ? 'text-gradient-gold' :
              s.color === 'green' ? 'text-gradient-green' :
              'text-dark-300'
            }`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Winnings List */}
      {!winners || winners.length === 0 ? (
        <div className="card p-16 text-center">
          <Trophy className="w-12 h-12 text-dark-700 mx-auto mb-4" />
          <p className="text-dark-400 text-lg font-medium">No winnings yet</p>
          <p className="text-dark-600 text-sm mt-2">Keep entering scores each month for your chance to win!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map(winner => (
            <div key={winner.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${winner.match_type === '5-match' ? 'badge-gold' : 'badge-green'}`}>
                      {winner.match_type}
                    </span>
                    <span className="text-dark-400 text-sm">{(winner.draws as any)?.title}</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-gradient-gold">
                    £{winner.prize_amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(winner.verification_status, winner.payment_status)}
                  <span className={`text-sm ${
                    winner.payment_status === 'paid' ? 'text-brand-400' :
                    winner.verification_status === 'rejected' ? 'text-red-400' :
                    'text-gold-400'
                  }`}>
                    {statusLabel(winner.verification_status, winner.payment_status)}
                  </span>
                </div>
              </div>

              {/* Winning numbers */}
              {(winner.draws as any)?.winning_numbers && (
                <div className="flex gap-2 mb-4">
                  <span className="text-dark-500 text-xs mr-1">Winning numbers:</span>
                  {(winner.draws as any).winning_numbers.map((n: number, i: number) => (
                    <span key={i} className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-[10px] flex items-center justify-center font-mono">
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* Upload proof CTA */}
              {winner.verification_status === 'pending' && !winner.proof_url && (
                <div className="glass-gold rounded-xl p-4">
                  <p className="text-gold-300 text-sm font-medium mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload proof to claim your prize
                  </p>
                  <p className="text-dark-400 text-xs mb-3">
                    Take a screenshot of your scores on this platform and upload it for verification.
                  </p>
                  {/* In a real app, this would open a file upload modal */}
                  <button className="btn-gold text-sm">Upload Screenshot</button>
                </div>
              )}

              {winner.admin_notes && (
                <p className="text-dark-500 text-xs mt-3 italic">Admin note: {winner.admin_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
