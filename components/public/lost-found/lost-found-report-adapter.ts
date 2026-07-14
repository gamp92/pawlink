import type {
  AnonymousLostFoundReportPayload,
  LostFoundReportAdapterResult,
} from '@/components/public/lost-found/types'

export async function submitAnonymousLostFoundReport(
  payload: AnonymousLostFoundReportPayload,
): Promise<LostFoundReportAdapterResult> {
  // TODO: Replace this temporary frontend adapter when the backend can persist
  // anonymous reporter contact fields, size/sex/date metadata, and Supabase
  // Storage photo URLs for the complete payload. Do not call /api/lost-found
  // here because it cannot store all required frontend data yet.
  await new Promise((resolve) => setTimeout(resolve, 900))

  return {
    ok: true,
    result: {
      report_id: `local-report-${payload.incident.report_type}-${Date.now()}`,
      status: 'received_for_review',
      submitted_at: new Date().toISOString(),
    },
  }
}
