type ProgressStep<StepId extends string> = {
  id: StepId
  label: string
  description?: string
}

export function FlowProgress<StepId extends string>({
  steps,
  currentStep,
  onSelectStep,
}: {
  steps: Array<ProgressStep<StepId>>
  currentStep: StepId
  onSelectStep: (step: StepId) => void
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="overflow-x-auto pb-1" aria-label="Form progress">
      <div className="flex min-w-[640px] items-start">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep
          const isComplete = index < currentIndex
          return (
            <div key={step.id} className="flex flex-1 items-start">
              <button
                type="button"
                onClick={() => onSelectStep(step.id)}
                className="group flex min-w-0 flex-1 items-start gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-violet-100"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-black shadow-sm transition duration-300 ${
                    isCurrent
                      ? 'border-violet-600 bg-violet-600 text-white shadow-violet-200'
                      : isComplete
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-black ${isCurrent ? 'text-slate-950' : 'text-slate-600'}`}>
                    {step.label}
                  </span>
                  {step.description ? (
                    <span className="mt-0.5 block text-xs leading-4 text-slate-500">{step.description}</span>
                  ) : null}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className={`mt-6 h-0.5 w-8 shrink-0 rounded-full ${isComplete ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
