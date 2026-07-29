import type { ReactNode } from 'react'
import styles from './chat.module.css'

type Role = 'user' | 'assistant'

type BubbleProps = {
  children: ReactNode
  role: Role
  citation?: string
  muted?: boolean
  /** Block-level content rendered under the text (e.g. animal chips). Kept out of the
   *  text <p> because a <div>/<ul> inside a <p> is invalid HTML and React will warn. */
  footer?: ReactNode
  className?: string
}

const roleClasses: Record<Role, string> = {
  user: styles.bubbleUser,
  assistant: styles.bubbleAssistant,
}

export function Bubble({
  children,
  role,
  citation,
  muted = false,
  footer,
  className = '',
}: BubbleProps) {
  return (
    <div
      className={[styles.bubble, roleClasses[role], muted ? styles.bubbleMuted : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <p className={styles.bubbleText}>{children}</p>
      {footer}
      {citation && !muted ? <p className={styles.bubbleCitation}>Source: {citation}</p> : null}
    </div>
  )
}
