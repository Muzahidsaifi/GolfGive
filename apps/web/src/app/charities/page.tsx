import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Heart, ExternalLink, Search, Star } from 'lucide-react'

export const metadata = { title: 'Charities' }

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const supabase = createClient()
  const search = searchParams.search || ''

  let query = supabase
    .from('charities')
    .select('*, charity_events(*)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')

  if (search) query = query.ilike('name', `%${search}%`)

  const { data: charities } = await query

  const featured = charities?.filter(c => c.is_featured) || []
  const others   = charities?.filter(c => !c.is_featured) || []

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Header */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="orb orb-green w-[400px] h-[400px] top-0 left-1/2 -translate-x-1/2 opacity-10" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="badge-green mb-4 mx-auto w-fit">
            <Heart className="w-3 h-3" />
            Our Charity Partners
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Your Game,<br />
            <span className="text-gradient-green">Their Future</span>
          </h1>
          <p className="text-dark-400 text-lg mb-8">
            Choose the cause your subscription supports. Every month, your contribution makes a real difference.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <form>
              <input
                name="search"
                defaultValue={search}
                className="input pl-11 pr-4"
                placeholder="Search charities..."
              />
            </form>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-20">

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-4 h-4 text-gold-400" />
              <h2 className="font-display text-2xl font-bold">Featured Charities</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featured.map(charity => (
                <div key={charity.id} className="card card-glow p-6 relative">
                  <span className="badge-gold text-[10px] absolute top-4 right-4">Featured</span>
                  <div className="w-12 h-12 rounded-xl glass-green flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-brand-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{charity.name}</h3>
                  <p className="text-dark-400 text-sm mb-4 line-clamp-3">{charity.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-400 text-sm">
                      {charity.charity_events?.length || 0} upcoming events
                    </span>
                    {charity.website_url && (
                      <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                         className="text-dark-500 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All others */}
        {others.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">All Charities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {others.map(charity => (
                <div key={charity.id} className="card p-5">
                  <h3 className="font-semibold text-white mb-2">{charity.name}</h3>
                  <p className="text-dark-400 text-sm mb-3 line-clamp-2">{charity.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-500 text-xs">
                      {charity.charity_events?.length || 0} events
                    </span>
                    {charity.website_url && (
                      <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                         className="text-dark-500 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!charities || charities.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-dark-700 mx-auto mb-4" />
            <p className="text-dark-400">No charities found{search ? ` for "${search}"` : ''}.</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-dark-400 mb-4">Ready to support a cause?</p>
          <Link href="/subscribe" className="btn-primary">
            Subscribe & Choose Your Charity
          </Link>
        </div>
      </div>
    </div>
  )
}
