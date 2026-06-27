import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProgressContext } from '../../hooks/useProgressContext'
import { useTutorContext } from '../../hooks/useTutorContext'
import { sendTutorMessage } from '../../services/aiTutorService'
import { getMasteryProfile, summarizeMasteryForTutor } from '../../services/masteryProfileService'
import { summarizeLessonPerformance } from '../../lib/lessonPerformanceSummary'
import { getLessonMetadata } from '../../types/lessonMetadata'
import type { AiTutorTurn, TutorDiagram as TutorDiagramSpec } from '../../services/ai/types'
import { TutorDiagram } from './TutorDiagram'

/** A chat message, plus an optional figure the tutor returned with an assistant turn. */
type ChatMessage = AiTutorTurn & { diagram?: TutorDiagramSpec }

const GREETING =
  "Hi! I'm your tutor. Ask me anything about what you're working on — I'll help you reason it out, not just hand over the answer."

const QUICK_PROMPTS = [
  'Can you explain this another way?',
  'Why is this wrong?',
  'Can you show another example?',
  "I'm confused.",
]

/**
 * Persistent, always-available AI tutor. A floating button opens a chat panel that is aware of the
 * current question (via the tutor context) and the learner's weak concepts (via the mastery
 * profile). It guides rather than answers — that behavior lives in the provider/prompt, not here.
 */
export function AiTutorWidget() {
  const { user } = useAuth()
  const { questionContext } = useTutorContext()
  const { getProgress } = useProgressContext()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [masterySummary, setMasterySummary] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Pull a short mastery summary when the panel opens so replies can be personalized.
  useEffect(() => {
    if (!open || !user) {
      return
    }
    let cancelled = false
    void getMasteryProfile(user.uid)
      .then((profile) => {
        if (!cancelled) {
          setMasterySummary(summarizeMasteryForTutor(profile))
        }
      })
      .catch(() => {
        // Personalization is best-effort; the tutor still works without it.
      })
    return () => {
      cancelled = true
    }
  }, [open, user])

  // Keep the latest message in view.
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, pending, open])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || pending) {
        return
      }

      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }]
      setMessages(nextMessages)
      setInput('')
      setPending(true)

      const lessonId = questionContext?.lessonId
      const lessonTitle = lessonId ? getLessonMetadata(lessonId)?.title : undefined
      const lessonPerformance = lessonId
        ? summarizeLessonPerformance(getProgress(lessonId), questionContext?.currentAttempts)
        : undefined

      try {
        const response = await sendTutorMessage({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            lessonId,
            lessonTitle,
            questionId: questionContext?.questionId,
            questionPrompt: questionContext?.questionPrompt,
            solutionSteps: questionContext?.solutionSteps,
            progressNote: questionContext?.progressNote,
            lessonPerformance,
            masterySummary: masterySummary || undefined,
          },
        })
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: response.reply, diagram: response.diagram },
        ])
      } finally {
        setPending(false)
      }
    },
    [getProgress, masterySummary, messages, pending, questionContext],
  )

  if (!user) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="tutor-fab"
        aria-label={open ? 'Close the AI tutor' : 'Open the AI tutor'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '×' : 'Ask the tutor'}
      </button>

      {open && (
        <section className="tutor-panel" role="dialog" aria-label="AI tutor">
          <header className="tutor-panel__header">
            <span className="tutor-panel__title">AI Tutor</span>
            <button
              type="button"
              className="tutor-panel__close"
              aria-label="Close tutor"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="tutor-panel__messages" ref={listRef}>
            <p className="tutor-msg tutor-msg--assistant">{GREETING}</p>
            {messages.map((message, index) => (
              <div key={index} className={`tutor-msg tutor-msg--${message.role}`}>
                {message.content && <span className="tutor-msg__text">{message.content}</span>}
                {message.role === 'assistant' && message.diagram && (
                  <TutorDiagram diagram={message.diagram} />
                )}
              </div>
            ))}
            {pending && (
              <p className="tutor-msg tutor-msg--assistant tutor-msg--pending" aria-live="polite">
                Thinking…
              </p>
            )}
          </div>

          {messages.length === 0 && (
            <div className="tutor-panel__suggestions">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="tutor-chip"
                  onClick={() => void send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            className="tutor-panel__input"
            onSubmit={(event) => {
              event.preventDefault()
              void send(input)
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the tutor…"
              aria-label="Message the tutor"
            />
            <button type="submit" className="button button--primary" disabled={pending || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      )}
    </>
  )
}
