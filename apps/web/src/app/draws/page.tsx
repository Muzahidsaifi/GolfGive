import { createClient } from '@/lib/supabase/server'
import { Calendar, Trophy, Users, Dices } from 'lucide-react'

export const metadata = { title: 'Draws' }

export default async function DrawsPage() {
  const supabase = createClient()

  const [{ data: published }, { data: upcoming }] = await Promise.all([
    supabase.from('draws').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(6),
    supabase.from('draws').select('*').eq('status', 'upcoming').order('draw_date').limit(3),
  ])

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Header */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="orb orb-gold w-[400px] h-[400px] top-0 left-1/2 -translate-x-1/2 opacity-10" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="badge-gold mb-4 mx-auto w-fit">
            <Trophy className="w-3 h-3" />
            Monthly Prize Draws
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient-gold">Win Every</span><br />
            Month
          </h1>
          <p className="text-dark-400 text-lg">
            Your 5 Stableford scores become your draw numbers. Match 3, 4, or all 5 to win your share of the prize pool.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-20">

        {/* How Draws Work */}
        <div className="card p-8 mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">How The Draw Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Your Scores = Your Numbers',
                desc: 'Each month, your latest 5 Stableford scores (1–45) are your draw entries.',
                color: 'green',
              },
              {
                step: '02',
                title: '5 Numbers Are Drawn',
                desc: 'On draw day, 5 winning numbers are randomly or algorithmically selected.',
                color: 'gold',
              },
              {
                step: '03',
                title: 'Prizes Paid Out',
                desc: 'Match 3 = 25% pool. Match 4 = 35%. Match all 5 = 40% Jackpot!',
                color: 'green',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`font-mono text-4xl font-bold mb-3 ${
                  item.color === 'gold' ? 'text-gradient-gold' : 'text-gradient-green'
                }`}>
                  {item.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Draws */}
        {upcoming && upcoming.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-3xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-brand-400" />
              Upcoming Draws
            </h2>
            <div className="space-y-4">
              {upcoming.map(draw => (
                <div key={draw.id} className="card glass-green p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">{draw.title}</h3>
                    <p className="text-dark-400 text-sm mt-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      {new Date(draw.draw_date).toLocaleDateString('en-GB', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="badge-green text-xs">Upcoming</span>
                    <p className="text-dark-500 text-xs mt-2 capitalize">
                      {draw.logic} draw
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Draws */}
        {published && published.length > 0 && (
          <div>
            <h2 className="font-display text-3xl font-bold mb-6 flex items-center gap-3">
              <Dices className="w-6 h-6 text-gold-400" />
              Past Draws
            </h2>
            <div className="space-y-4">
              {published.map(draw => (
                <div key={draw.id} className="card p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{draw.title}</h3>
                      <p className="text-dark-500 text-sm">
                        {new Date(draw.draw_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })} · {draw.participant_count} participants
                      </p>
                      {draw.winning_numbers && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-dark-500 text-xs mr-1">Winning numbers:</span>
                          {draw.winning_numbers.map((n: number, i: number) => (
                            <span
                              key={i}
                              className="w-8 h-8 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-sm flex items-center justify-center font-mono font-bold"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-dark-400 text-xs mb-1">Prize Pool</p>
                      <p className="font-display text-2xl font-bold text-gradient-gold">
                        £{(draw.total_pool || 0).toLocaleString('en-GB', {
                          minimumFractionDigits: 2, maximumFractionDigits: 2
                        })}
                      </p>
                      <div className="flex gap-2 justify-end mt-2">
                        <span className="text-dark-500 text-xs">
                          J: £{(draw.jackpot_amount || 0).toFixed(0)}
                        </span>
                        <span className="text-dark-500 text-xs">
                          4M: £{(draw.four_match_amount || 0).toFixed(0)}
                        </span>
                        <span className="text-dark-500 text-xs">
                          3M: £{(draw.three_match_amount || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-dark-400 mb-4">Not a member yet?</p>
          <a href="/subscribe" className="btn-primary text-base px-8 py-4">
            Join & Enter Next Draw
          </a>
        </div>
      </div>
    </div>
  )
}
