import styles from './chat.module.css'

type StatRowProps = {
  label: string
  value: string | number
  className?: string
}

/**
 * Inline label-left / value-right row, meant to sit inside a <dl>.
 * Renders <dt> for the label and <dd> for the value inside a wrapping <div>.
 */
export function StatRow({ label, value, className = '' }: StatRowProps) {
  return (
    <div className={[styles.statRow, className].filter(Boolean).join(' ')}>
      <dt className={styles.statRowLabel}>{label}</dt>
      <dd className={styles.statRowValue}>{value}</dd>
    </div>
  )
}
