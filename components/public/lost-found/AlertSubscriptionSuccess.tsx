import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '@/components/shared/Button'
import type { AlertSubscriptionForm, AlertSubscriptionResult } from '@/components/public/lost-found/types'

export function AlertSubscriptionSuccess({
  form,
  result,
  onClose,
  onCreateAnother,
}: {
  form: AlertSubscriptionForm
  result: AlertSubscriptionResult
  onClose: () => void
  onCreateAnother: () => void
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const titleRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' && event.target === titleRef.current) {
      onClose()
    }
  }

  const selectedLocation = form.location?.label ?? 'Selected map area'

  return (
    <section className="pawlink-alert-success-card" aria-labelledby="alert-success-title" onKeyDown={handleKeyDown}>
      <div className="pawlink-alert-success-hero">
        <div className="pawlink-alert-success-illustration" aria-hidden="true">
          <svg viewBox="0 0 120 120" role="img">
            <circle cx="60" cy="60" r="45" fill="#f0fdfa" />
            <path d="M39 62c0-15 9-26 21-26s21 11 21 26v11l9 10H30l9-10V62Z" fill="#7c3aed" />
            <path d="M51 86c2 5 5 8 9 8s7-3 9-8H51Z" fill="#0d9488" />
            <circle cx="85" cy="40" r="14" fill="#ffffff" />
            <path d="m79 40 4 4 8-9" fill="none" stroke="#0d9488" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
          </svg>
        </div>
        <div className="pawlink-alert-success-check" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" />
            <path d="m14 24 7 7 14-16" />
          </svg>
        </div>
        <h3
          id="alert-success-title"
          ref={titleRef}
          tabIndex={-1}
          className="pawlink-alert-success-title"
        >
          You're all set!
        </h3>
        <p className="pawlink-alert-success-subtitle">
          You'll receive an email whenever a matching lost or found pet appears near your selected location.
        </p>
      </div>

      <div className="pawlink-alert-summary-card" aria-label="Alert summary">
        <SummaryRow
          icon={<MapPinIcon />}
          label="Selected location"
          value={selectedLocation}
        />
        <SummaryRow
          icon={<MailIcon />}
          label="Email address"
          value={form.email}
        />
        <SummaryRow
          icon={<PetIcon />}
          label="Alert type"
          value="Lost and found pet reports"
        />
        <SummaryRow
          icon={<SignalIcon />}
          label="Search radius"
          value="Using the default search radius."
          muted
        />
      </div>

      <div className="pawlink-alert-technical">
        <button
          type="button"
          className="pawlink-alert-technical-toggle"
          onClick={() => setShowTechnicalDetails((current) => !current)}
          aria-expanded={showTechnicalDetails}
          aria-controls="alert-technical-details"
        >
          Technical details
          <span aria-hidden="true">{showTechnicalDetails ? '-' : '+'}</span>
        </button>
        {showTechnicalDetails ? (
          <dl id="alert-technical-details" className="pawlink-alert-technical-details">
            <div>
              <dt>Subscription ID</dt>
              <dd>{result.subscription_id}</dd>
            </div>
            <div>
              <dt>Created At</dt>
              <dd>{formatDateTime(result.submitted_at)}</dd>
            </div>
            <div>
              <dt>Backend Status</dt>
              <dd>{result.status}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="pawlink-alert-success-actions">
        <Button type="button" onClick={onClose} size="lg" fullWidth>
          Return to Lost & Found
        </Button>
        <Button type="button" variant="secondary" onClick={onCreateAnother} size="lg" fullWidth>
          Create another alert
        </Button>
      </div>
    </section>
  )
}

function SummaryRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: ReactNode
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="pawlink-alert-summary-row">
      <span className="pawlink-alert-summary-icon" aria-hidden="true">{icon}</span>
      <span>
        <span className="pawlink-alert-summary-label">{label}</span>
        <span className={muted ? 'pawlink-alert-summary-value pawlink-alert-summary-value-muted' : 'pawlink-alert-summary-value'}>
          {value}
        </span>
      </span>
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 21s7-6.1 7-12A7 7 0 0 0 5 9c0 5.9 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <path d="m5.5 8 6.5 5 6.5-5" />
    </svg>
  )
}

function PetIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <circle cx="8" cy="8" r="2.2" />
      <circle cx="16" cy="8" r="2.2" />
      <circle cx="6.5" cy="14" r="2" />
      <circle cx="17.5" cy="14" r="2" />
      <path d="M8.5 17.5c0-2 1.7-4 3.5-4s3.5 2 3.5 4c0 1.4-1.2 2.5-3.5 2.5s-3.5-1.1-3.5-2.5Z" />
    </svg>
  )
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <circle cx="12" cy="12" r="3" />
      <path d="M6.5 17.5a8 8 0 0 1 0-11" />
      <path d="M17.5 6.5a8 8 0 0 1 0 11" />
    </svg>
  )
}
