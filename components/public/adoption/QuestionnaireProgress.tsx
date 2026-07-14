import type { AdoptionApplicationStep } from '@/components/public/adoption/types'

const steps: Array<{ id: AdoptionApplicationStep; label: string }> = [
  { id: 'contact', label: 'Contact' },
  { id: 'household', label: 'Home' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'intent', label: 'Intent' },
  { id: 'review', label: 'Review' },
]

export function QuestionnaireProgress({
  currentStep,
  onSelectStep,
}: {
  currentStep: AdoptionApplicationStep
  onSelectStep: (step: AdoptionApplicationStep) => void
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div aria-label="Application progress">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep
          const isComplete = index < currentIndex
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={`flex min-w-[92px] flex-1 items-center gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                isCurrent
                  ? 'border-violet-300 bg-violet-50 text-violet-800'
                  : isComplete
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-black shadow-sm">
                {index + 1}
              </span>
              <span className="text-xs font-black">{step.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const adoptionApplicationSteps = steps
