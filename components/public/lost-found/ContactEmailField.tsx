import type { LostFoundReportForm } from '@/components/public/lost-found/types'

// Optional contact field shown on the report's review step — if left blank,
// the report still submits normally, it just can't be emailed if it's later
// matched via vision search.
export function ContactEmailField({
  form,
  onChange,
}: {
  form: LostFoundReportForm
  onChange: (value: string) => void
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="lost-found-contact-email" className="block text-sm font-black text-slate-950">
        Want us to email you if we find a match? (optional)
      </label>
      <input
        id="lost-found-contact-email"
        type="email"
        value={form.contact_email}
        onChange={(event) => onChange(event.target.value)}
        placeholder="you@email.com"
        maxLength={255}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-violet-400"
      />
    </div>
  )
}
