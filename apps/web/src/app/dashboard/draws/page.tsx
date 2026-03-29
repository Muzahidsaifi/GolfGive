import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dices, Calendar, Trophy, Target } from 'lucide-react'

export const metadata = { title: 'My Draws' }

export default async function DashboardDrawsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: entries }, { data: upcoming }] = await Promise.all([
    supabase
      .from('draw_entries')
      .select('*, draws(title, draw_date, winning_numbers, total_pool, status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('draws')
      .select('*')
      .eq('status', 'upcoming')
      .order('draw_date')
      .limit(1)
      .single(),
  ])

  const matchColors: Record<string, string> = {
    '5-match': 'badge-gold',
    '4-match': 'badge-green',
    '3-match': 'badge-green',
    'no-match': 'badge-gray',
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">My Draws</h1>
        <p className="text-dark-400">Your draw participation history and results.</p>
      </div>

      {/* Upcoming Draw Banner */}
      {upcoming && (
        <div className="glass-green rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-brand-400" />
            <span className="text-brand-300 font-semibold">Next Draw</span>
          </div>
          <h2 className="font-display text-2xl font-bold mb-1">{(upcoming as any).title}</h2>
          <p className="text-dark-400 text-sm">
            {new Date((upcoming as any).draw_date).toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <p className="text-dark-500 text-xs mt-2">
            Make sure you have 5 scores entered to be included in this draw.
          </p>
        </div>
      )}

      {/* Draw Entry History */}
      {!entries || entries.length === 0 ? (
        <div className="card p-16 text-center">
          <Dices className="w-12 h-12 text-dark-700 mx-auto mb-4" />
          <p className="text-dark-400 text-lg font-medium">No draw history yet</p>
          <p className="text-dark-600 text-sm mt-2">
            You'll appear in draws once you have 5 scores and an active subscription.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry: any) => (
            <div key={entry.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{entry.draws?.title}</p>
                  <p className="text-dark-500 text-xs mt-0.5">
                    {new Date(entry.draws?.draw_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`badge text-[10px] ${matchColors[entry.match_type] || 'badge-gray'}`}>
                  {entry.match_type}
                </span>
              </div>

              {/* User's scores in this draw */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-dark-500 text-xs">Your scores:</span>
                {entry.scores_snapshot?.map((score: number, i: number) => {
                  const isMatch = entry.draws?.winning_numbers?.includes(score)
                  return (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-mono font-bold ${
                        isMatch
                          ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                          : 'bg-dark-800 border border-white/8 text-dark-400'
                      }`}
                    >
                      {score}
                    </span>
                  )
                })}
              </div>

              {/* Winning numbers */}
              {entry.draws?.winning_numbers && entry.draws.status === 'published' && (
                <div className="flex items-center gap-2">
                  <span className="text-dark-500 text-xs">Winning numbers:</span>
                  {entry.draws.winning_numbers.map((n: number, i: number) => (
                    <span
                      key={i}
                      className="w-7 h-7 rounded-full bg-gold-500/15 border border-gold-500/25 text-gold-400 text-xs flex items-center justify-center font-mono"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* Prize */}
              {entry.prize_amount > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gold-400" />
                  <span className="text-gold-400 font-bold">
                    Won £{entry.prize_amount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
