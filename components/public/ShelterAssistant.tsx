'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { shelterProfile as fallbackShelterProfile, type ShelterProfile } from '@/lib/mock-data'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  citation?: string
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let isMounted = true

    async function loadDocuments() {
      try {
        const response = await fetch(`/api/rag/documents?shelter_id=${activeShelterId}`, { cache: 'no-store' })
        const payload = (await response.json()) as { documents?: RagDocument[] }
        if (isMounted) setDocuments(payload.documents ?? [])
      } catch {
        if (isMounted) setDocuments([])
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
      id: `user-${messages.length}`,
      role: 'user',
      text: trimmedQuestion,
    }

    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setIsTyping(true)

    const assistantId = `assistant-${messages.length + 1}`
    setMessages((current) => [...current, { id: assistantId, role: 'assistant', text: '' }])

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelter_id: activeShelterId, question: trimmedQuestion }),
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
          if (event.done) {
            const citation = event.citation
              ? `${event.citation.file_name} - Section ${event.citation.section}`
              : undefined
            setMessages((current) => current.map((m) => (m.id === assistantId ? { ...m, citation } : m)))
          }
        }
      }
    } catch {
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantId ? { ...m, text: 'No pude contactar al asistente. Intenta de nuevo.' } : m,
        ),
      )
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
          {profile.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{profile.name}</h2>
          {isLoadingProfile ? <StatusBadge label="Loading" tone="amber" /> : null}
        </div>
        <p className="text-[11px] text-slate-500">{profile.city}</p>
        <p className="mt-3 text-xs leading-5 text-slate-600">{profile.description}</p>

        {profileError ? (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] font-semibold text-amber-700">
            {profileError}
          </div>
        ) : null}
        {isUsingFallbackProfile ? (
          <div className="mt-2">
            <StatusBadge label="Fallback profile" tone="amber" />
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          {[
            ['Animals', profile.stats.total_animals],
            ['Available', profile.stats.available_animals],
            ['Adoptions', profile.stats.total_adoptions],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-500">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold">Documents</h3>
            <StatusBadge label={`${readyDocuments.length} ready`} tone="teal" />
          </div>
          <div className="mt-2 space-y-2">
            {documents.length === 0 ? (
              <p className="text-[11px] text-slate-400">No documents ingested for this shelter yet.</p>
            ) : null}
            {documents.map((document) => (
              <div key={document.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-slate-700">{document.file_name}</p>
                  <StatusBadge
                    label={document.status}
                    tone={document.status === 'ready' ? 'green' : 'amber'}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {document.chunk_count ? `${document.chunk_count} chunks` : 'Processing'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section
        className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
        style={{ height: 600 }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold">Shelter Assistant</h2>
            <p className="mt-1 text-[11px] text-slate-400">Live answers from the RAG service</p>
          </div>
          <select
            value={activeShelterId}
            onChange={(event) => {
              setActiveShelterId(event.target.value)
              setMessages(initialMessages)
            }}
            className="rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-700"
          >
            {TEST_SHELTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 0 }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[82%] rounded-lg px-3 py-2 text-xs leading-5 ${
                message.role === 'user'
                  ? 'ml-auto bg-violet-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <p>{message.text}</p>
              {message.citation ? (
                <p className="mt-1 text-[11px] font-semibold text-teal-600">Source: {message.citation}</p>
              ) : null}
            </div>
          ))}

          {isTyping ? (
            <div className="max-w-[82%] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              Assistant is typing...
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-200 p-4">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendMessage()
            }}
            placeholder="Ask about adoption, vaccines, requirements, hours, or documents..."
            className="flex-1 rounded border border-slate-200 px-3 py-2 text-xs text-slate-950"
          />
          <button
            onClick={sendMessage}
            className="rounded bg-violet-600 px-4 py-2 text-xs font-bold text-white"
          >
            Send
          </button>
        </div>
      </section>
    </div>
  )
}
