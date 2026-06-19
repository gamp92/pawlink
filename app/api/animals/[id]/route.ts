import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// PATCH /api/animals/:id
// Updates an existing animal
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('animals')
    .update(body)
    .eq('id', params.id)
    .select('id, status, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ animal: data }, { status: 200 })
}

// DELETE /api/animals/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('animals')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Animal deleted' }, { status: 200 })
}
