'use client'

import { useEffect, useMemo, useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ragMessages, shelterDocuments, shelterProfile as fallbackShelterProfile, type ShelterProfile } from '@/lib/mock-data'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  citation?: string
}

type MockAnswer = {
  text: string
  citation: string
}

type ApiShelter = ShelterProfile & {
  address?: string | null
  website_url?: string | null
  founded_year?: number | null
}

const initialMessages: ChatMessage[] = ragMessages.map((message, index) => ({
  id: `seed-${index}`,
  role: message.role === 'user' ? 'user' : 'assistant',
  text: message.text,
  citation: 'citation' in message ? message.citation : undefined,
}))

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string) {
  return uuidPattern.test(value)
}

function getMockAnswer(question: string): MockAnswer {
  const normalizedQuestion = question.toLowerCase()

  if (normalizedQuestion.includes('adoption') || normalizedQuestion.includes('adopt')) {
    return {
      text: 'The adoption process starts with a compatibility review, then a short interview, and finally a home-readiness confirmation before the pet goes home.',
      citation: 'politicas_adopcion.pdf - Section 3',
    }
  }

  if (normalizedQuestion.includes('vaccine') || normalizedQuestion.includes('vaccines') || normalizedQuestion.includes('vaccinated')) {
    return {
      text: 'Animals leave with current vaccines, including rabies and core boosters, plus a medical card for the adopter.',
      citation: 'protocolo_vacunacion.pdf - Section 2',
    }
  }

  if (normalizedQuestion.includes('requirement') || normalizedQuestion.includes('requirements')) {
    return {
      text: 'Families should bring an ID, proof of address, and be ready for a short interview about routine, home setup, and previous pet experience.',
      citation: 'requisitos_familias.pdf - Section 1',
    }
  }

  if (normalizedQuestion.includes('hour') || normalizedQuestion.includes('hours') || normalizedQuestion.includes('open')) {
    return {
      text: 'Public visits are available by appointment from 10:00 to 17:00, Monday through Saturday.',
      citation: 'requisitos_familias.pdf - Section 4',
    }
  }

  if (normalizedQuestion.includes('document') || normalizedQuestion.includes('documents')) {
    return {
      text: 'This shelter has adoption policies, family requirements, and vaccination protocol documents available for assistant answers.',
      citation: 'document_index.mock - Section 1',
    }
  }

  return {
    text: "I could not find that in this shelter's mock documents. Try asking about adoption, vaccines, requirements, hours, or documents.",
    citation: 'mock-retrieval-empty - Section 0',
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

  useEffect(() => {
    let isMounted = true

    async function loadShelterProfile() {
      if (!isUuid(shelterId)) {
        setProfile(fallbackShelterProfile)
        setIsUsingFallbackProfile(true)
        setProfileError('This shelter link uses a mock id. Showing fallback profile.')
        setIsLoadingProfile(false)
        return
      }

      try {
        const response = await fetch(`/api/shelters/${shelterId}`, { cache: 'no-store' })
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
  }, [shelterId])

  const readyDocuments = useMemo(
    () => shelterDocuments.filter((document) => document.status === 'ready'),
    [],
  )

  function sendMessage() {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isTyping) return

    const userMessage: ChatMessage = {
      id: `user-${messages.length}`,
      role: 'user',
      text: trimmedQuestion,
    }
    const answer = getMockAnswer(trimmedQuestion)

    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setIsTyping(true)

    setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${current.length}`,
          role: 'assistant',
          text: answer.text,
          citation: answer.citation,
        },
      ])
      setIsTyping(false)
    }, 650)
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
            {shelterDocuments.map((document) => (
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

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold">Shelter Assistant</h2>
            <p className="mt-1 text-[11px] text-slate-400">Mock answers from shelter documents</p>
          </div>
          <StatusBadge label="mock RAG" tone="purple" />
        </div>

        <div className="space-y-3 p-4">
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
              Assistant is checking mock documents...
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
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
        </div>
      </section>
    </div>
  )
}
