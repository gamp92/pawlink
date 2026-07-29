'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { shelterProfile as fallbackShelterProfile, type ShelterProfile } from '@/lib/mock-data'
import { AnimalChips, Bubble, Composer, StatRow, type ChatAnimal } from './shelter-assistant'
import styles from './shelter-assistant/chat.module.css'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  citation?: string
  /** Structured animals from the RAG `inventory` route, rendered as chips under the text. */
  animals?: ChatAnimal[]
}

type RagDocument = {
  id: string
  file_name: string
  status: string
  chunk_count: number | null
}

type ApiShelter = ShelterProfile & {
  address?: string | null
  website_url?: string | null
  founded_year?: number | null
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string) {
  return uuidPattern.test(value)
}

// Shelters with real ingested policy PDFs, for testing the RAG integration end to end.
const TEST_SHELTERS = [
  { id: '7a2f59a5-7d2f-477c-b11d-fe7c98d7aa30', label: 'Refugio Patitas Felices' },
  { id: 'ad78a080-9d7b-4739-bd12-1257281fbab2', label: 'Hogar Animal CDMX' },
]

const initialMessages: ChatMessage[] = [
  { id: 'seed-0', role: 'assistant', text: 'Hola, soy el asistente del refugio. Preguntame sobre adopcion, vacunas, requisitos, horarios o documentos.' },
]

function chatStorageKey(id: string) {
  return `pawlink:chat:${id}`
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (typeof candidate.id !== 'string') return false
  if (candidate.role !== 'user' && candidate.role !== 'assistant') return false
  if (typeof candidate.text !== 'string') return false
  if (candidate.citation !== undefined && typeof candidate.citation !== 'string') return false
  if (candidate.animals !== undefined && !Array.isArray(candidate.animals)) return false
  return true
}

function readStoredMessages(id: string): ChatMessage[] | null {
  try {
    const raw = sessionStorage.getItem(chatStorageKey(id))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (!parsed.every(isChatMessage)) return null
    return parsed
  } catch {
    return null
  }
}

type ShelterAssistantProps = {
  shelterId: string
}

export function ShelterAssistant({ shelterId }: ShelterAssistantProps) {
  const [profile, setProfile] = useState<ShelterProfile>(fallbackShelterProfile)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isUsingFallbackProfile, setIsUsingFallbackProfile] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [question, setQuestion] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeShelterId, setActiveShelterId] = useState(
    () => TEST_SHELTERS.find((s) => s.id === shelterId)?.id ?? TEST_SHELTERS[0].id,
  )
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageIdRef = useRef(0)
  const streamAbortRef = useRef<AbortController | null>(null)

  function nextId(prefix: string) {
    messageIdRef.current += 1
    return `${prefix}-${messageIdRef.current}`
  }

  useEffect(() => {
    const storedMessages = readStoredMessages(activeShelterId)
    if (!storedMessages) return

    const highestIdSuffix = storedMessages.reduce((highest, message) => {
      const suffix = Number(message.id.split('-').pop())
      return Number.isFinite(suffix) && suffix > highest ? suffix : highest
    }, messageIdRef.current)

    messageIdRef.current = highestIdSuffix
    setMessages(storedMessages)
  }, [activeShelterId])

  useEffect(() => {
    if (messages === initialMessages) return

    try {
      sessionStorage.setItem(chatStorageKey(activeShelterId), JSON.stringify(messages))
    } catch {
      return
    }
  }, [activeShelterId, messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort()
    }
  }, [activeShelterId])

  useEffect(() => {
    let isMounted = true

    setIsLoadingDocuments(true)
    setDocumentsError(null)

    async function loadDocuments() {
      try {
        const response = await fetch(`/api/rag/documents?shelter_id=${activeShelterId}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Could not load documents')
        }
        const payload = (await response.json()) as { documents?: RagDocument[] }
        if (!isMounted) return
        setDocuments(payload.documents ?? [])
      } catch {
        if (!isMounted) return
        setDocuments([])
        setDocumentsError('Could not reach the RAG service.')
      } finally {
        if (isMounted) setIsLoadingDocuments(false)
      }
    }

    loadDocuments()
    return () => {
      isMounted = false
    }
  }, [activeShelterId])

  useEffect(() => {
    let isMounted = true

    async function loadShelterProfile() {
      if (!isUuid(activeShelterId)) {
        setProfile(fallbackShelterProfile)
        setIsUsingFallbackProfile(true)
        setProfileError('This shelter link uses a mock id. Showing fallback profile.')
        setIsLoadingProfile(false)
        return
      }

      setIsLoadingProfile(true)
      try {
        const response = await fetch(`/api/shelters/${activeShelterId}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Could not load shelter profile')
        }

        const payload = (await response.json()) as { shelter?: ApiShelter }

        if (!isMounted) return

        if (!payload.shelter) {
          setProfile(fallbackShelterProfile)
          setIsUsingFallbackProfile(true)
          setProfileError('No shelter profile returned yet. Showing fallback profile.')
          return
        }

        setProfile({
          id: payload.shelter.id,
          name: payload.shelter.name,
          description: payload.shelter.description ?? 'Partner shelter profile.',
          city: payload.shelter.city ?? 'CDMX',
          cover_photo: payload.shelter.cover_photo ?? '',
          instagram_url: payload.shelter.instagram_url ?? '',
          stats: payload.shelter.stats,
        })
        setIsUsingFallbackProfile(false)
        setProfileError(null)
      } catch {
        if (!isMounted) return
        setProfile(fallbackShelterProfile)
        setIsUsingFallbackProfile(true)
        setProfileError('Shelter profile API is unavailable. Showing fallback profile.')
      } finally {
        if (isMounted) setIsLoadingProfile(false)
      }
    }

    loadShelterProfile()

    return () => {
      isMounted = false
    }
  }, [activeShelterId])

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === 'ready'),
    [documents],
  )

  async function sendMessage() {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isTyping) return

    const userMessage: ChatMessage = {
      id: nextId('user'),
      role: 'user',
      text: trimmedQuestion,
    }

    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setIsTyping(true)

    const assistantId = nextId('assistant')
    setMessages((current) => [...current, { id: assistantId, role: 'assistant', text: '' }])

    streamAbortRef.current?.abort()
    const controller = new AbortController()
    streamAbortRef.current = controller

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelter_id: activeShelterId, question: trimmedQuestion }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error('RAG request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const event = JSON.parse(line.slice(5).trim())

          if (event.token) {
            setMessages((current) =>
              current.map((m) => (m.id === assistantId ? { ...m, text: m.text + event.token } : m)),
            )
          }
          // `inventory` route emits this before its tokens, so the chips paint while the
          // LLM is still writing.
          if (event.animals) {
            setMessages((current) =>
              current.map((m) => (m.id === assistantId ? { ...m, animals: event.animals } : m)),
            )
          }
          if (event.done) {
            const citation = event.citation
              ? `${event.citation.file_name} - Section ${event.citation.section}`
              : undefined
            setMessages((current) => current.map((m) => (m.id === assistantId ? { ...m, citation } : m)))
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantId ? { ...m, text: 'No pude contactar al asistente. Intenta de nuevo.' } : m,
        ),
      )
    } finally {
      // Only the most recent request owns the typing state. A superseded request
      // must not clear it; an aborted-but-still-current one must (otherwise
      // switching shelters mid-stream leaves the composer disabled forever).
      if (streamAbortRef.current === controller) setIsTyping(false)
    }
  }

  function switchShelter(nextShelterId: string) {
    streamAbortRef.current?.abort()
    setActiveShelterId(nextShelterId)
    setMessages(initialMessages)
  }

  return (
    <div className={styles.layout}>
      <aside className="ds-card ds-card-pad-sm">
        <Avatar name={profile.name} tone="teal" size="sm" />

        <div className={styles.sidebarHead}>
          <h2 className={styles.sidebarName}>{profile.name}</h2>
          {isLoadingProfile ? <Badge tone="amber">Loading</Badge> : null}
        </div>
        <p className={styles.sidebarCity}>{profile.city}</p>
        <p className={styles.sidebarDescription}>{profile.description}</p>

        {profileError ? <p className={styles.notice}>{profileError}</p> : null}
        {isUsingFallbackProfile ? <Badge tone="amber">Fallback profile</Badge> : null}

        <dl className={styles.stack}>
          <StatRow label="Animals" value={profile.stats.total_animals} />
          <StatRow label="Available" value={profile.stats.available_animals} />
          <StatRow label="Adoptions" value={profile.stats.total_adoptions} />
        </dl>

        <div className={styles.sidebarSection}>
          <div className={styles.sidebarSectionHead}>
            <h3 className={styles.sidebarSectionTitle}>Documents</h3>
            {isLoadingDocuments ? (
              <Badge tone="amber">Loading</Badge>
            ) : (
              <Badge tone="teal">{readyDocuments.length} ready</Badge>
            )}
          </div>
          <div className={styles.stack}>
            {/* The RAG service is on Render's free tier and cold-starts in 20-45s.
                Showing the empty state while loading reads as "no documents". */}
            {isLoadingDocuments ? (
              <p className={styles.empty}>Loading documents… the RAG service may be waking up.</p>
            ) : null}
            {documentsError ? <p className={styles.notice}>{documentsError}</p> : null}
            {!isLoadingDocuments && !documentsError && documents.length === 0 ? (
              <p className={styles.empty}>No documents ingested for this shelter yet.</p>
            ) : null}
            {documents.map((document) => (
              <div key={document.id} className="ds-card ds-card-muted ds-card-pad-sm">
                <div className={styles.docRow}>
                  <p className={styles.docName}>{document.file_name}</p>
                  <Badge tone={document.status === 'ready' ? 'green' : 'amber'}>{document.status}</Badge>
                </div>
                <p className={styles.docMeta}>
                  {document.chunk_count ? `${document.chunk_count} chunks` : 'Processing'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className={`ds-card ${styles.panel}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Shelter Assistant</h2>
            <p className={styles.panelSubtitle}>Live answers from the RAG service</p>
          </div>
          <select
            value={activeShelterId}
            onChange={(event) => switchShelter(event.target.value)}
            aria-label="Shelter"
            className={styles.shelterPicker}
          >
            {TEST_SHELTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div ref={scrollRef} className={styles.thread}>
          {messages.map((message) => (
            <Bubble
              key={message.id}
              role={message.role}
              citation={message.citation}
              footer={message.animals ? <AnimalChips animals={message.animals} /> : null}
            >
              {message.text}
            </Bubble>
          ))}

          {isTyping ? (
            <Bubble role="assistant" muted>
              Assistant is typing...
            </Bubble>
          ) : null}
        </div>

        <div className={styles.panelFooter}>
          <Composer
            value={question}
            onChange={setQuestion}
            onSend={sendMessage}
            disabled={isTyping}
            placeholder="Ask about adoption, vaccines, requirements, hours, or documents..."
          />
        </div>
      </section>
    </div>
  )
}
