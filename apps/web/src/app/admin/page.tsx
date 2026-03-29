import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Trophy, Heart, BarChart2, Dices, ArrowRight, CheckCircle, Clock } from 'lucide-react'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch stats
  const [
    { count: totalUsers },
    { count: activeSubs },
    { data: pendingWinners },
    { data: recentDraws },
    { count: totalCharities },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('winners').select('id, match_type, prize_amount, profiles(full_name)').eq('verification_status', 'pending').limit(5),
    supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(5),
    supabase.from('charities').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const adminSections = [
    { href: '/admin/users',     icon: Users,   label: 'Users',     sub: `${totalUsers || 0} total users`, color: 'green' },
    { href: '/admin/draws',     icon: Dices,   label: 'Draws',     sub: 'Configure & publish draws', color: 'gold' },
    { href: '/admin/charities', icon: Heart,   label: 'Charities', sub: `${totalCharities || 0} active`, color: 'green' },
    { href: '/admin/winners',   icon: Trophy,  label: 'Winners',   sub: `${pendingWinners?.length || 0} pending`, color: 'gold' },
    { href: '/admin/reports',   icon: BarChart2, label: 'Reports', sub: 'Analytics & financials', color: 'green' },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="badge-gold mb-2">Admin Panel</span>
            <h1 className="font-display text-4xl font-bold mt-2">Control Centre</h1>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">User View</Link>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Users',        value: totalUsers || 0,   icon: Users,      color: 'green' },
            { label: 'Active Subscribers', value: activeSubs || 0,   icon: CheckCircle, color: 'green' },
            { label: 'Active Charities',   value: totalCharities || 0, icon: Heart,    color: 'green' },
            { label: 'Pending Verifications', value: pendingWinners?.length || 0, icon: Clock, color: 'gold' },
          ].map((kpi, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-dark-400 text-xs">{kpi.label}</p>
                <kpi.icon className={`w-4 h-4 ${kpi.color === 'gold' ? 'text-gold-400' : 'text-brand-400'}`} />
              </div>
              <p className={`font-display text-3xl font-bold ${kpi.color === 'gold' ? 'text-gradient-gold' : 'text-gradient-green'}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Admin Sections */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {adminSections.map((sec, i) => (
            <Link key={i} href={sec.href} className="card card-glow p-6 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  sec.color === 'gold'
                    ? 'bg-gold-500/10 border border-gold-500/20'
                    : 'bg-brand-500/10 border border-brand-500/20'
                }`}>
                  <sec.icon className={`w-5 h-5 ${sec.color === 'gold' ? 'text-gold-400' : 'text-brand-400'}`} />
                </div>
                <div>
                  <p className="text-white font-semibold">{sec.label}</p>
                  <p className="text-dark-500 text-xs">{sec.sub}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-600 group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>

        {/* Pending Winners */}
        {pendingWinners && pendingWinners.length > 0 && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">Pending Verifications</h2>
              <Link href="/admin/winners" className="text-gold-400 text-sm flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {pendingWinners.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{w.profiles?.full_name}</p>
                    <p className="text-dark-500 text-xs">{w.match_type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gold-400 font-bold">£{w.prize_amount?.toFixed(2)}</span>
                    <span className="badge-gold text-[10px]">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Draws */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">Recent Draws</h2>
            <Link href="/admin/draws" className="text-brand-400 text-sm flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentDraws?.map((draw: any) => (
              <div key={draw.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{draw.title}</p>
                  <p className="text-dark-500 text-xs">
                    {new Date(draw.draw_date).toLocaleDateString('en-GB')} · {draw.participant_count || 0} participants
                  </p>
                </div>
                <span className={`badge text-[10px] ${
                  draw.status === 'published' ? 'badge-green' :
                  draw.status === 'upcoming' ? 'badge-gold' : 'badge-gray'
                }`}>
                  {draw.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
