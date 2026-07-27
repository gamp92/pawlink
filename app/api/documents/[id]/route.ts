import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// DELETE /api/documents/:id
// Best-effort Storage cleanup, then deletes the row. No shelter_id ownership
// check — matches the existing DELETE /api/animals/:id convention.
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('shelter_documents')
    .select('storage_path')
    .eq('id', params.id)
    .single()

  if (existing?.storage_path) {
    await supabase.storage.from('documents').remove([existing.storage_path])
  }

  const { error } = await supabase
    .from('shelter_documents')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Document deleted' }, { status: 200 })
}
