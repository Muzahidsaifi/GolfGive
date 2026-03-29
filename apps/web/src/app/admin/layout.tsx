import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Dices, Heart, Trophy, BarChart2, LogOut, ArrowLeft } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role, email').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const navLinks = [
    { href: '/admin',           icon: LayoutDashboard, label: 'Overview' },
    { href: '/admin/users',     icon: Users,           label: 'Users' },
    { href: '/admin/draws',     icon: Dices,           label: 'Draws' },
    { href: '/admin/charities', icon: Heart,           label: 'Charities' },
    { href: '/admin/winners',   icon: Trophy,          label: 'Winners' },
    { href: '/admin/reports',   icon: BarChart2,       label: 'Reports' },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      <aside className="w-64 hidden md:flex flex-col border-r border-white/5 fixed top-0 left-0 h-full z-40"
             style={{ background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)' }}>
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="font-display text-2xl font-bold text-gradient-green">GolfGive</Link>
          <div className="badge-gold mt-2 text-[10px] w-fit">Admin Panel</div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
            >
              <link.icon className="w-4 h-4 text-dark-500 group-hover:text-gold-400 transition-colors" />
              {link.label}
            </Link>
          ))}

          <div className="divider my-3" />
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-white/5 transition-all text-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-dark-500 group-hover:text-brand-400 transition-colors" />
            User Dashboard
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-sm font-bold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-dark-500 text-xs truncate">Administrator</p>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">{children}</main>
    </div>
  )
}
