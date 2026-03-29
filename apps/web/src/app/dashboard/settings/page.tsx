import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, CreditCard, Bell, User, Shield } from 'lucide-react'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: subscription }, { data: userCharity }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('user_charities').select('*, charities(name)').eq('user_id', user.id).single(),
  ])

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Settings</h1>
        <p className="text-dark-400">Manage your account and preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-400" />
          Profile
        </h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center text-brand-400 text-2xl font-bold">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{profile?.full_name}</p>
            <p className="text-dark-400 text-sm">{profile?.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-dark-400 text-sm">Member since</span>
            <span className="text-white text-sm">
              {new Date(profile?.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-dark-400 text-sm">Account type</span>
            <span className={`badge text-[10px] ${profile?.role === 'admin' ? 'badge-gold' : 'badge-green'}`}>
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-brand-400" />
          Subscription
        </h2>
        {subscription ? (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-dark-400 text-sm">Status</span>
              <span className={`badge text-[10px] ${
                subscription.status === 'active' ? 'badge-green' :
                subscription.status === 'past_due' ? 'badge-red' :
                'badge-gray'
              }`}>
                {subscription.status}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-dark-400 text-sm">Plan</span>
              <span className="text-white text-sm capitalize">{subscription.plan}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-dark-400 text-sm">
                {subscription.cancel_at_period_end ? 'Cancels on' : 'Renews on'}
              </span>
              <span className={`text-sm ${subscription.cancel_at_period_end ? 'text-red-400' : 'text-white'}`}>
                {new Date(subscription.current_period_end).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-dark-400 text-sm">Charity contribution</span>
              <span className="text-brand-400 text-sm font-medium">{subscription.charity_percentage}%</span>
            </div>
            {(userCharity as any)?.charities && (
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 text-sm">Supporting</span>
                <span className="text-white text-sm">{(userCharity as any).charities.name}</span>
              </div>
            )}

            {/* Manage via Stripe Portal */}
            <ManageSubscriptionButton />
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-dark-400 text-sm mb-4">You don't have an active subscription.</p>
            <a href="/subscribe" className="btn-primary text-sm">Subscribe Now</a>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-400" />
          Security
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <div>
              <p className="text-white text-sm">Password</p>
              <p className="text-dark-500 text-xs">Last changed: Unknown</p>
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5">Change Password</button>
          </div>
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-white text-sm">Email</p>
              <p className="text-dark-500 text-xs">{profile?.email}</p>
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5">Change Email</button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-red-500/20 rounded-xl p-6">
        <h2 className="font-display text-lg font-bold mb-2 text-red-400">Danger Zone</h2>
        <p className="text-dark-400 text-sm mb-4">
          Deleting your account is permanent and cannot be undone.
        </p>
        <button className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm transition-all">
          Delete Account
        </button>
      </div>
    </div>
  )
}

function ManageSubscriptionButton() {
  return (
    <form action="/api/subscriptions/portal" method="POST" className="pt-3">
      <button type="submit" className="btn-secondary text-sm w-full flex items-center justify-center gap-2">
        <CreditCard className="w-4 h-4" />
        Manage Billing & Subscription
      </button>
    </form>
  )
}
