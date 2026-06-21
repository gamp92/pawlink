import { ragMessages, shelterProfile } from '@/lib/mock-data'

export function ShelterAssistant() {
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
          RP
        </div>
        <h2 className="mt-3 text-sm font-bold">{shelterProfile.name}</h2>
        <p className="text-[11px] text-slate-500">{shelterProfile.city}</p>

        <div className="mt-3 space-y-2">
          {[
            ['Animals', shelterProfile.stats.total_animals],
            ['Adoptions', shelterProfile.stats.total_adoptions],
            ['Since', '2018'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-500">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 text-[11px] leading-5 text-teal-700">
          <p>- Adoption policy</p>
          <p>- Requirements</p>
          <p>- FAQ</p>
        </div>
      </aside>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold">Shelter Assistant</h2>
          <p className="text-[11px] text-slate-400">Answers from shelter docs</p>
        </div>

        <div className="space-y-3 p-4">
          {ragMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[82%] rounded-lg px-3 py-2 text-xs leading-5 ${
                message.role === 'user'
                  ? 'ml-auto bg-violet-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <p>{message.text}</p>
              {'citation' in message ? (
                <p className="mt-1 text-[11px] font-semibold text-teal-600">Source: {message.citation}</p>
              ) : null}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <div className="flex-1 rounded border border-slate-200 px-3 py-2 text-xs text-slate-400">
              Ask anything about this shelter...
            </div>
            <button className="rounded bg-violet-600 px-4 py-2 text-xs font-bold text-white">Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
