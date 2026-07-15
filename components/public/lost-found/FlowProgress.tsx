type ProgressStep<StepId extends string> = {
  id: StepId
  label: string
  description?: string
  icon?: string
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
    <div className="report-flow-stepper" aria-label="Form progress">
      <div className="report-flow-stepper-track">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep
          const isComplete = index < currentIndex
          return (
            <div key={step.id} className="report-flow-step-item">
              <button
                type="button"
                onClick={() => onSelectStep(step.id)}
                className="report-flow-step-button"
                aria-current={isCurrent ? 'step' : undefined}
                data-current={isCurrent}
                data-complete={isComplete}
              >
                <span className="report-flow-step-node">
                  {isComplete ? '✓' : index + 1}
                </span>
                <span className="report-flow-step-copy">
                  {step.icon ? <span className="report-flow-step-icon">{step.icon}</span> : null}
                  <span className="report-flow-step-label">{step.label}</span>
                  {step.description ? (
                    <span className="report-flow-step-description">{step.description}</span>
                  ) : null}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className="report-flow-step-line" data-complete={isComplete} />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
