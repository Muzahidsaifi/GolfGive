import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Target, Heart, Trophy, Settings, Dices, Shield } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role, email').eq('id', user.id).single()

  const navLinks = [
    { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/scores',   icon: Target,          label: 'My Scores' },
    { href: '/dashboard/draws',    icon: Dices,           label: 'Draws' },
    { href: '/dashboard/charity',  icon: Heart,           label: 'My Charity' },
    { href: '/dashboard/winnings', icon: Trophy,          label: 'Winnings' },
    { href: '/dashboard/settings', icon: Settings,        label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">

      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col glass border-r border-white/5 fixed top-0 left-0 h-full z-40">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="font-display text-2xl font-bold text-gradient-green">GolfGive</Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
            >
              <link.icon className="w-4 h-4 text-dark-500 group-hover:text-brand-400 transition-colors" />
              {link.label}
            </Link>
          ))}

          {profile?.role === 'admin' && (
            <>
              <div className="divider my-3" />
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-gold-500/10 transition-all text-sm group"
              >
                <Shield className="w-4 h-4 text-dark-500 group-hover:text-gold-400 transition-colors" />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-sm font-bold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-dark-500 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  )
}
