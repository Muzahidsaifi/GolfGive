import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/winners/[id]/proof — user uploads proof screenshot
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify this winner belongs to the user
  const { data: winner } = await supabase
    .from('winners')
    .select('id, user_id, verification_status')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!winner) return NextResponse.json({ error: 'Winner not found' }, { status: 404 })
  if (winner.verification_status !== 'pending') {
    return NextResponse.json({ error: 'Verification already processed' }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get('proof') as File

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  // Validate file type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only image files allowed (JPG, PNG, WebP, GIF)' }, { status: 400 })
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  const admin = createAdminClient()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.type.split('/')[1]
  const path = `proofs/${user.id}/${params.id}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await admin.storage
    .from('winner-proofs')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage
    .from('winner-proofs')
    .getPublicUrl(path)

  // Update winner record
  const { error } = await admin
    .from('winners')
    .update({ proof_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { proof_url: publicUrl } })
}
