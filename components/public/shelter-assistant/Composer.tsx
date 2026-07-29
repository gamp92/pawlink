import type { KeyboardEvent } from 'react'
import { Button } from '@/components/shared/Button'
import styles from './chat.module.css'

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function Composer({ value, onChange, onSend, disabled = false, placeholder, className = '' }: ComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    if (disabled) return
    if (event.nativeEvent.isComposing) return
    if (!value.trim()) return
    onSend()
  }

  return (
    <div className={[styles.composer, className].filter(Boolean).join(' ')}>
      <div className={`ds-input-shell ${styles.composerInputShell}`}>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Message the shelter assistant"
          className="ds-input"
        />
      </div>
      <Button variant="primary" size="sm" type="button" disabled={disabled || !value.trim()} onClick={onSend}>
        Send
      </Button>
    </div>
  )
}
