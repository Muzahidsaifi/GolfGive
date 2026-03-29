'use client'

import { useState, useEffect } from 'react'
import { BarChart2, Users, Trophy, Heart, TrendingUp, DollarSign } from 'lucide-react'

interface Stats {
  total_users: number
  active_subscribers: number
  draws_completed: number
  total_prize_pool_all_time: number
  total_winners: number
  total_paid_out: number
  charity_breakdown: { charity_id: string; charity_name: string; total: number }[]
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/reports')
      .then(r => r.json())
      .then(j => { setStats(j.data); setLoading(false) })
  }, [])

  const conversionRate = stats
    ? Math.round((stats.active_subscribers / Math.max(stats.total_users, 1)) * 100)
    : 0

  const maxCharity = stats?.charity_breakdown
    ? Math.max(...stats.charity_breakdown.map(c => c.total), 1)
    : 1

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Reports & Analytics</h1>
        <p className="text-dark-400">Platform-wide statistics and financial summary.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-28 shimmer" />)}
        </div>
      ) : stats ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Total Users',         value: stats.total_users,             icon: Users,       color: 'green',  format: 'num' },
              { label: 'Active Subscribers',  value: stats.active_subscribers,      icon: TrendingUp,  color: 'green',  format: 'num' },
              { label: 'Conversion Rate',     value: conversionRate,                icon: BarChart2,   color: 'green',  format: 'pct' },
              { label: 'Draws Completed',     value: stats.draws_completed,         icon: Trophy,      color: 'gold',   format: 'num' },
              { label: 'Total Prize Pool',    value: stats.total_prize_pool_all_time, icon: DollarSign, color: 'gold',  format: 'gbp' },
              { label: 'Total Paid Out',      value: stats.total_paid_out,          icon: DollarSign,  color: 'gold',   format: 'gbp' },
            ].map((kpi, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-dark-400 text-xs">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color === 'gold' ? 'text-gold-400' : 'text-brand-400'}`} />
                </div>
                <p className={`font-display text-3xl font-bold ${kpi.color === 'gold' ? 'text-gradient-gold' : 'text-gradient-green'}`}>
                  {kpi.format === 'gbp' ? `£${kpi.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                   kpi.format === 'pct' ? `${kpi.value}%` :
                   kpi.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Estimated Monthly Revenue */}
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Estimated Monthly Revenue
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  label: 'Monthly Revenue',
                  value: stats.active_subscribers * 9.99,
                  sub: `${stats.active_subscribers} × £9.99`,
                  color: 'green',
                },
                {
                  label: 'Monthly Prize Pool',
                  value: stats.active_subscribers * 9.99 * 0.5,
                  sub: '50% of revenue',
                  color: 'gold',
                },
                {
                  label: 'Monthly Charity Contribution',
                  value: stats.active_subscribers * 9.99 * 0.1,
                  sub: '10% minimum across all users',
                  color: 'green',
                },
              ].map((row, i) => (
                <div key={i} className={`glass-${row.color} rounded-xl p-5`}>
                  <p className="text-dark-400 text-xs mb-2">{row.label}</p>
                  <p className={`font-display text-2xl font-bold ${row.color === 'gold' ? 'text-gradient-gold' : 'text-gradient-green'}`}>
                    £{row.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-dark-500 text-xs mt-1">{row.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Charity Breakdown */}
          {stats.charity_breakdown.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                <Heart className="w-5 h-5 text-brand-400" />
                Charity Contribution Breakdown
              </h2>
              <div className="space-y-4">
                {stats.charity_breakdown
                  .sort((a, b) => b.total - a.total)
                  .map((charity, i) => (
                    <div key={charity.charity_id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm font-medium">{charity.charity_name}</span>
                        <span className="text-brand-400 font-bold text-sm">
                          £{charity.total.toFixed(2)}/mo
                        </span>
                      </div>
                      <div className="w-full bg-dark-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-600 to-brand-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(charity.total / maxCharity) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-16 text-center">
          <BarChart2 className="w-12 h-12 text-dark-700 mx-auto mb-4" />
          <p className="text-dark-400">No data available yet.</p>
        </div>
      )}
    </div>
  )
}
