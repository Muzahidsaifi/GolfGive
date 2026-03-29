import Link from 'next/link'
import { ArrowRight, Heart, Trophy, Target, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] overflow-hidden">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-2xl font-bold text-gradient-green">GolfGive</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/subscribe" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Orbs */}
        <div className="orb orb-green w-[600px] h-[600px] top-[-100px] left-[-200px]" />
        <div className="orb orb-gold w-[400px] h-[400px] bottom-[100px] right-[-100px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="badge-green mb-6 mx-auto w-fit animate-fade-in">
            <Heart className="w-3 h-3" />
            <span>Charity-first golf platform</span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl font-bold leading-tight mb-6 animate-slide-up">
            Play Golf.<br />
            <span className="text-gradient-green">Win Prizes.</span><br />
            <span className="text-gradient-gold">Fund Change.</span>
          </h1>

          <p className="text-dark-300 text-xl max-w-2xl mx-auto mb-10 animate-fade-in">
            Enter your Stableford scores. Join the monthly draw.
            A portion of every subscription goes to the charity you choose.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/subscribe" className="btn-primary text-base flex items-center gap-2 justify-center">
              Start Your Membership <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/draws" className="btn-secondary text-base">
              See How Draws Work
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-dark-400 text-lg max-w-xl mx-auto">
            Simple. Transparent. Impactful.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: 'Enter Your Scores', desc: 'Log your last 5 Stableford rounds (1–45). Your scores are your lottery tickets.', color: 'brand' },
            { icon: Trophy, title: 'Monthly Draw', desc: '5 winning numbers are drawn each month. Match 3, 4, or all 5 to win from the prize pool.', color: 'gold' },
            { icon: Heart, title: 'Fund Your Charity', desc: 'At least 10% of your subscription goes directly to the charity you care about.', color: 'brand' },
          ].map((item, i) => (
            <div key={i} className="card card-glow p-8 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                item.color === 'gold'
                  ? 'bg-gold-500/10 border border-gold-500/20'
                  : 'bg-brand-500/10 border border-brand-500/20'
              }`}>
                <item.icon className={`w-6 h-6 ${item.color === 'gold' ? 'text-gold-400' : 'text-brand-400'}`} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-dark-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '£10K+', label: 'Prize Pool Monthly' },
            { value: '2,000+', label: 'Active Members' },
            { value: '£50K+', label: 'Donated to Charity' },
            { value: '12', label: 'Charity Partners' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="font-display text-4xl font-bold text-gradient-green mb-2">{stat.value}</div>
              <div className="text-dark-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Prize Pool Breakdown */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-5xl font-bold mb-6">
              Win Big.<br />
              <span className="text-gradient-gold">Every Month.</span>
            </h2>
            <p className="text-dark-400 text-lg mb-8">
              The prize pool grows with every subscriber. Match your scores to the winning numbers — the more you match, the more you win.
            </p>
            <div className="space-y-4">
              {[
                { match: '5 Numbers', pool: '40%', label: 'Jackpot', rollover: true, color: 'gold' },
                { match: '4 Numbers', pool: '35%', label: 'Second Tier', rollover: false, color: 'brand' },
                { match: '3 Numbers', pool: '25%', label: 'Third Tier', rollover: false, color: 'brand' },
              ].map((tier, i) => (
                <div key={i} className={`glass-${tier.color} p-4 rounded-xl flex items-center justify-between`}>
                  <div>
                    <span className={`font-bold ${tier.color === 'gold' ? 'text-gold-400' : 'text-brand-400'}`}>
                      Match {tier.match}
                    </span>
                    <span className="text-dark-400 text-sm ml-2">{tier.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">{tier.pool}</span>
                    {tier.rollover && (
                      <span className="badge-gold text-[10px]">Jackpot rolls over</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="text-dark-400 text-sm mb-2">Example Monthly Pool</div>
              <div className="font-display text-5xl font-bold text-gradient-green">£8,400</div>
              <div className="text-dark-400 text-sm mt-1">with 1,000 subscribers</div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Jackpot Pool',  amount: '£3,360', pct: '40%' },
                { label: 'Second Tier',   amount: '£2,940', pct: '35%' },
                { label: 'Third Tier',    amount: '£2,100', pct: '25%' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-dark-400">{row.label}</span>
                  <div className="text-right">
                    <span className="text-white font-bold">{row.amount}</span>
                    <span className="text-dark-500 text-xs ml-2">{row.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="glass-green rounded-3xl p-12">
            <Heart className="w-12 h-12 text-brand-400 mx-auto mb-6" />
            <h2 className="font-display text-5xl font-bold mb-4">
              Ready to Make a<br />
              <span className="text-gradient-green">Difference?</span>
            </h2>
            <p className="text-dark-400 text-lg mb-8">
              Join thousands of golfers who play for more than just a score.
            </p>
            <Link href="/subscribe" className="btn-primary text-base flex items-center gap-2 mx-auto w-fit">
              Subscribe Now — From £9.99/mo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-display text-xl font-bold text-gradient-green">GolfGive</span>
          <p className="text-dark-500 text-sm">© 2025 GolfGive. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-dark-500">
            <Link href="/charities" className="hover:text-white transition-colors">Charities</Link>
            <Link href="/draws" className="hover:text-white transition-colors">Draws</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
