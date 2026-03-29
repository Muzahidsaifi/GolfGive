'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Users, Search, CheckCircle, XCircle, Crown, Mail } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  subscriptions?: {
    status: string
    plan: string
    current_period_end: string
  }
  golf_scores?: { score: number; played_at: string }[]
  user_charities?: { charities: { name: string } }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<User | null>(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    const json = await res.json()
    setUsers(json.data || [])
    setLoading(false)
  }

  async function toggleAdmin(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'subscriber' : 'admin'
    if (!confirm(`Change this user's role to ${newRole}?`)) return

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      toast.success(`Role updated to ${newRole}`)
      fetchUsers()
    } else {
      toast.error('Failed to update role')
    }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">User Management</h1>
        <p className="text-dark-400">View and manage all platform users.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          className="input pl-11"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: users.length },
          { label: 'Active Subscribers', value: users.filter(u => u.subscriptions?.status === 'active').length },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <p className="text-dark-400 text-xs mb-1">{s.label}</p>
            <p className="font-display text-2xl font-bold text-gradient-green">{s.value}</p>
          </div>
        ))}
      </div>

      {/* User Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-dark-400 text-xs font-medium">User</th>
                <th className="text-left p-4 text-dark-400 text-xs font-medium">Subscription</th>
                <th className="text-left p-4 text-dark-400 text-xs font-medium">Scores</th>
                <th className="text-left p-4 text-dark-400 text-xs font-medium">Charity</th>
                <th className="text-left p-4 text-dark-400 text-xs font-medium">Role</th>
                <th className="text-left p-4 text-dark-400 text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 rounded shimmer w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-dark-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.full_name}</p>
                          <p className="text-dark-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.subscriptions ? (
                        <div>
                          <span className={`badge text-[10px] ${
                            user.subscriptions.status === 'active' ? 'badge-green' : 'badge-red'
                          }`}>
                            {user.subscriptions.status}
                          </span>
                          <p className="text-dark-500 text-xs mt-1 capitalize">{user.subscriptions.plan}</p>
                        </div>
                      ) : (
                        <span className="badge-gray text-[10px]">No sub</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {(user.golf_scores || []).map((s, i) => (
                          <span key={i} className="w-6 h-6 rounded-full bg-dark-700 text-dark-300 text-[10px] flex items-center justify-center font-mono">
                            {s.score}
                          </span>
                        ))}
                        {(!user.golf_scores || user.golf_scores.length === 0) && (
                          <span className="text-dark-600 text-xs">None</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-dark-400 text-xs">
                        {(user.user_charities as any)?.charities?.name || '—'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${user.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelected(user)}
                          className="text-dark-500 hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/5"
                        >
                          View
                        </button>
                        <button
                          onClick={() => toggleAdmin(user.id, user.role)}
                          className="text-dark-500 hover:text-gold-400 transition-colors"
                          title="Toggle admin"
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
             onClick={() => setSelected(null)}>
          <div className="card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center text-brand-400 text-xl font-bold">
                {selected.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">{selected.full_name}</h2>
                <p className="text-dark-400 text-sm">{selected.email}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 text-sm">Role</span>
                <span className={`badge text-[10px] ${selected.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>
                  {selected.role}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 text-sm">Subscription</span>
                <span className={`badge text-[10px] ${
                  selected.subscriptions?.status === 'active' ? 'badge-green' : 'badge-red'
                }`}>
                  {selected.subscriptions?.status || 'None'}
                </span>
              </div>
              {selected.subscriptions && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-dark-400 text-sm">Plan</span>
                  <span className="text-white text-sm capitalize">{selected.subscriptions.plan}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 text-sm">Joined</span>
                <span className="text-white text-sm">
                  {new Date(selected.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 text-sm">Scores</span>
                <div className="flex gap-1">
                  {selected.golf_scores?.map((s, i) => (
                    <span key={i} className="score-ball w-7 h-7 text-xs">{s.score}</span>
                  )) || <span className="text-dark-500 text-sm">None</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Close</button>
              <button
                onClick={() => toggleAdmin(selected.id, selected.role)}
                className="btn-gold flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <Crown className="w-4 h-4" />
                Toggle Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
