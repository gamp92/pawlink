type MetricCardProps = {
  label: string
  value: string | number
  detail?: string
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-none text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-[11px] text-slate-400">{detail}</p> : null}
    </div>
  )
}
