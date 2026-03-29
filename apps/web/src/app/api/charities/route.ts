import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/charities — public route, uses admin client to bypass RLS
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const featured = searchParams.get('featured')

  // Use admin client so RLS doesn't block public access
  const supabase = createAdminClient()

  let query = supabase
    .from('charities')
    .select('id, name, slug, description, website_url, is_featured, is_active, total_raised')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  if (featured === 'true') {
    query = query.eq('is_featured', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Charities fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}

// POST /api/charities — admin only
export async function POST(req: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('charities')
    .insert({
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description,
      logo_url: body.logo_url,
      banner_url: body.banner_url,
      website_url: body.website_url,
      is_featured: body.is_featured || false,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}