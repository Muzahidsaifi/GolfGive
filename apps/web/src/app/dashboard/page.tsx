import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy, Heart, Target, Calendar, TrendingUp,
  AlertCircle, CheckCircle, Clock, ArrowRight
} from 'lucide-react'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all data in parallel
  const [
    { data: profile },
    { data: subscription },
    { data: scores },
    { data: userCharity },
    { data: upcomingDraw },
    { data: myWinnings },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('golf_scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
    supabase.from('user_charities').select('*, charities(name, logo_url)').eq('user_id', user.id).single(),
    supabase.from('draws').select('*').eq('status', 'upcoming').order('draw_date').limit(1).single(),
    supabase.from('winners').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const isActive = subscription?.status === 'active'
  const totalWon = myWinnings?.reduce((s: number, w: any) => s + w.prize_amount, 0) || 0

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-dark-400 text-sm mb-1">Welcome back</p>
          <h1 className="font-display text-4xl font-bold">
            {profile?.full_name?.split(' ')[0]} 👋
          </h1>
        </div>

        {/* Subscription Banner */}
        {!isActive && (
          <div className="glass-gold rounded-2xl p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-gold-400" />
              <span className="text-gold-300 font-medium">
                Your subscription is {subscription?.status || 'inactive'}. Renew to stay in draws.
              </span>
            </div>
            <Link href="/subscribe" className="btn-gold text-sm">Renew Now</Link>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Subscription',
              value: isActive ? 'Active' : 'Inactive',
              sub: isActive ? `Renews ${new Date(subscription!.current_period_end).toLocaleDateString('en-GB')}` : 'Not active',
              icon: CheckCircle,
              color: isActive ? 'green' : 'gray',
            },
            {
              label: 'Scores Entered',
              value: `${scores?.length || 0}/5`,
              sub: 'Stableford scores',
              icon: Target,
              color: 'green',
            },
            {
              label: 'Total Won',
              value: `£${totalWon.toFixed(2)}`,
              sub: `${myWinnings?.length || 0} prizes`,
              icon: Trophy,
              color: 'gold',
            },
            {
              label: 'Charity %',
              value: `${subscription?.charity_percentage || 10}%`,
              sub: (userCharity as any)?.charities?.name || 'Not selected',
              icon: Heart,
              color: 'green',
            },
          ].map((stat, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-dark-400 text-xs">{stat.label}</p>
                <stat.icon className={`w-4 h-4 ${stat.color === 'gold' ? 'text-gold-400' : stat.color === 'green' ? 'text-brand-400' : 'text-dark-500'}`} />
              </div>
              <p className={`font-display text-2xl font-bold ${stat.color === 'gold' ? 'text-gradient-gold' : stat.color === 'green' ? 'text-gradient-green' : 'text-dark-300'}`}>
                {stat.value}
              </p>
              <p className="text-dark-500 text-xs mt-1 truncate">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Scores */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">My Scores</h2>
              <Link href="/dashboard/scores" className="text-brand-400 text-sm flex items-center gap-1 hover:text-brand-300">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {scores && scores.length > 0 ? (
              <div className="space-y-3">
                {scores.map((score: any, i: number) => (
                  <div key={score.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`score-ball text-sm w-10 h-10 ${i === 0 ? 'winning' : ''}`}>
                        {score.score}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{score.score} pts</p>
                        <p className="text-dark-500 text-xs">
                          {new Date(score.played_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                    {i === 0 && <span className="badge-green text-[10px]">Latest</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-8 h-8 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400 text-sm">No scores yet</p>
                <Link href="/dashboard/scores" className="btn-primary text-sm mt-4 inline-block">
                  Add First Score
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Draw */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">Upcoming Draw</h2>
              <Link href="/draws" className="text-brand-400 text-sm flex items-center gap-1 hover:text-brand-300">
                All Draws <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {upcomingDraw ? (
              <div>
                <div className="glass-green rounded-xl p-5 mb-4">
                  <p className="text-brand-400 text-sm font-medium mb-1">{(upcomingDraw as any).title}</p>
                  <div className="flex items-center gap-2 text-dark-300 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date((upcomingDraw as any).draw_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}</span>
                  </div>
                </div>
                <p className="text-dark-400 text-sm">
                  You need <strong className="text-white">5 scores</strong> to be entered into the draw.
                  Currently: <strong className={scores?.length === 5 ? 'text-brand-400' : 'text-gold-400'}>
                    {scores?.length || 0}/5
                  </strong>
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400 text-sm">No upcoming draw scheduled</p>
              </div>
            )}
          </div>

          {/* Charity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">My Charity</h2>
              <Link href="/dashboard/charity" className="text-brand-400 text-sm flex items-center gap-1 hover:text-brand-300">
                Change <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(userCharity as any)?.charities ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl glass flex items-center justify-center">
                  <Heart className="w-7 h-7 text-brand-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{(userCharity as any).charities.name}</p>
                  <p className="text-dark-400 text-sm">
                    {subscription?.charity_percentage || 10}% of your subscription
                  </p>
                  <p className="text-brand-400 text-xs mt-1">
                    ~£{((9.99 * (subscription?.charity_percentage || 10)) / 100).toFixed(2)}/mo donated
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Heart className="w-8 h-8 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400 text-sm mb-4">No charity selected</p>
                <Link href="/charities" className="btn-primary text-sm">Choose a Charity</Link>
              </div>
            )}
          </div>

          {/* Winnings */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">My Winnings</h2>
              <Link href="/dashboard/winnings" className="text-brand-400 text-sm flex items-center gap-1 hover:text-brand-300">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {myWinnings && myWinnings.length > 0 ? (
              <div className="space-y-3">
                {myWinnings.slice(0, 3).map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{w.match_type}</p>
                      <p className="text-dark-500 text-xs">{new Date(w.created_at).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold-400 font-bold">£{w.prize_amount.toFixed(2)}</p>
                      <span className={`text-xs ${
                        w.payment_status === 'paid' ? 'text-brand-400' :
                        w.verification_status === 'pending' ? 'text-gold-400' : 'text-dark-400'
                      }`}>
                        {w.payment_status === 'paid' ? 'Paid' :
                         w.verification_status === 'pending' ? 'Pending verification' : w.verification_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-8 h-8 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400 text-sm">No winnings yet — keep playing!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
