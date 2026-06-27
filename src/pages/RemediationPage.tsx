import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProgressContext } from '../hooks/useProgressContext'
import { PracticeRunner } from '../components/practice/PracticeRunner'
import { TutorDiagram } from '../components/tutor/TutorDiagram'
import { LessonIntroFigure } from '../components/lesson/LessonIntroFigure'
import { generatePracticeForLesson } from '../services/practiceEngine'
import { loadLessonContent } from '../services/questionService'
import { sendTutorMessage } from '../services/aiTutorService'
import type { TutorDiagram as TutorDiagramSpec } from '../services/ai/types'
import type { LessonIntro as LessonIntroContent } from '../types/lesson'
import {
  applyConceptOutcomes,
  deriveOutcomesFromAnswers,
  flagConceptsNeedFollowUp,
  getMasteryProfile,
  getWeakConcepts,
  summarizeMasteryForTutor,
} from '../services/masteryProfileService'
import { markRemediationCompleted } from '../services/progressService'
import { getMasteryStatus } from '../services/masteryService'
import { CONCEPT_LABELS, isTopicConcept, type ConceptTag } from '../types/concepts'
import { getLessonMetadata } from '../types/lessonMetadata'
import type { Question } from '../types/lesson'
import type { SkillCheckAnswer } from '../types/progress'
import '../styles/lesson.css'

type Step = 'diagnose' | 'lesson' | 'practice' | 'done'

const PRACTICE_COUNT = 4

const CONFUSION_OPTIONS = [
  { id: 'concept', label: "I don't understand the concept." },
  { id: 'confused', label: 'I knew it but got confused.' },
  { id: 'rushed', label: 'I rushed.' },
  { id: 'unsure', label: "I'm not sure where I went wrong." },
] as const

export function RemediationPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user } = useAuth()
  const { getProgress, refreshProgress } = useProgressContext()

  const [step, setStep] = useState<Step>('diagnose')
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([])
  const [weakTopics, setWeakTopics] = useState<ConceptTag[]>([])
  const [masterySummary, setMasterySummary] = useState('')
  const [tutorReply, setTutorReply] = useState('')
  const [tutorDiagram, setTutorDiagram] = useState<TutorDiagramSpec | null>(null)
  const [tutorLoading, setTutorLoading] = useState(false)
  // The lesson's own hand-built intro figure, reused as a reliable teaching visual for the refresher
  // when the tutor doesn't return its own diagram.
  const [intro, setIntro] = useState<LessonIntroContent | null>(null)
  const [ready, setReady] = useState(false)
  // Bumped on "Retry practice" to remount the runner with a fresh set of generated problems.
  const [practiceAttempt, setPracticeAttempt] = useState(0)
  const finishing = useRef(false)

  const lessonTitle = lessonId ? getLessonMetadata(lessonId)?.title ?? 'this lesson' : 'this lesson'

  // Remediation is available whenever the lesson is still unpassed (best skill-check score is Needs
  // Review). This means a learner who fails the skill check AGAIN — even after a prior practice
  // session unlocked the next lesson — gets a fresh personalized practice each time, rather than
  // being told there's nothing to review. Once they pass (Proficient/Mastered), it closes off.
  const allowed = useMemo(() => {
    if (!lessonId) {
      return false
    }
    return getMasteryStatus(getProgress(lessonId)) === 'needs_review'
  }, [getProgress, lessonId])

  useEffect(() => {
    if (!user || !lessonId || !allowed) {
      return
    }
    let cancelled = false

    async function prepare() {
      const [profile, questions, content] = await Promise.all([
        getMasteryProfile(user!.uid),
        generatePracticeForLesson(user!.uid, lessonId!, PRACTICE_COUNT),
        loadLessonContent(lessonId!),
      ])
      if (cancelled) {
        return
      }
      setWeakTopics(getWeakConcepts(profile).map((stat) => stat.concept).filter(isTopicConcept))
      setMasterySummary(summarizeMasteryForTutor(profile))
      setPracticeQuestions(questions)
      setIntro(content?.intro ?? null)
      setReady(true)
    }

    void prepare()
    return () => {
      cancelled = true
    }
  }, [allowed, lessonId, user])

  const handleChooseConfusion = useCallback(
    async (reasonLabel: string) => {
      setStep('lesson')
      setTutorLoading(true)
      try {
        const response = await sendTutorMessage({
          messages: [
            {
              role: 'user',
              content: `I just finished the skill check for "${lessonTitle}" and didn't do well. ${reasonLabel} Can you give me a short, encouraging refresher before I practice again? Please include a simple labeled example diagram (using example numbers, not an answer) if it helps me picture the idea.`,
            },
          ],
          context: {
            lessonId,
            lessonTitle,
            masterySummary: masterySummary || undefined,
          },
        })
        setTutorReply(response.reply)
        setTutorDiagram(response.diagram ?? null)
      } finally {
        setTutorLoading(false)
      }
    },
    [lessonId, lessonTitle, masterySummary],
  )

  const handlePracticeComplete = useCallback(
    async (answers: SkillCheckAnswer[]) => {
      if (!user || !lessonId || finishing.current) {
        return
      }
      finishing.current = true
      try {
        // Fold the practice results into the mastery profile, flag the weak concepts to revisit on a
        // later login, and mark the personalized review done. This does NOT unlock the next lesson on
        // its own — the learner now needs to retake the skill check, which finalizes the requirement.
        const outcomes = deriveOutcomesFromAnswers(practiceQuestions, answers)
        await applyConceptOutcomes(user.uid, outcomes)
        if (weakTopics.length > 0) {
          await flagConceptsNeedFollowUp(user.uid, weakTopics)
        }
        await markRemediationCompleted(user.uid, lessonId)
        await refreshProgress()
      } catch (error) {
        console.warn('Failed to finalize remediation', error)
      } finally {
        setStep('done')
      }
    },
    [lessonId, practiceQuestions, refreshProgress, user, weakTopics],
  )

  // "Retry" on the completion screen: regenerate a fresh short practice set and run it again.
  const handleRetryPractice = useCallback(async () => {
    if (!user || !lessonId) {
      return
    }
    finishing.current = false
    try {
      const questions = await generatePracticeForLesson(user.uid, lessonId, PRACTICE_COUNT)
      setPracticeQuestions(questions)
    } catch (error) {
      console.warn('Failed to regenerate practice', error)
    }
    setPracticeAttempt((value) => value + 1)
    setStep('practice')
  }, [lessonId, user])

  if (!lessonId) {
    return (
      <section className="lesson-error">
        <h1>Not found</h1>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  // Only block on entry. Once the session has started (and especially once it's finished — which
  // clears the "required retake pending" flag), keep showing the flow so the learner still reaches
  // the completion screen with its Retry / Retake options.
  if (!allowed && step === 'diagnose') {
    return (
      <section className="lesson-error">
        <h1>Nothing to review here</h1>
        <p className="muted">You've already moved past this one. Nice work!</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  if (!ready) {
    return (
      <section className="lesson-error">
        <p className="muted">Setting up your review session...</p>
      </section>
    )
  }

  const conceptLabels = weakTopics.map((concept) => CONCEPT_LABELS[concept])

  return (
    <section className="remediation">
      <header className="remediation__header">
        <p className="remediation__eyebrow">Personalized review</p>
        <h1 className="remediation__title">{lessonTitle}</h1>
      </header>

      {step === 'diagnose' && (
        <div className="remediation__card">
          <p className="remediation__lead">
            I noticed this lesson was a little tricky. Before we practice, what felt the most
            confusing?
          </p>
          <div className="remediation__options">
            {CONFUSION_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="button button--secondary remediation__option"
                onClick={() => void handleChooseConfusion(option.label)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'lesson' && (
        <div className="remediation__card">
          {conceptLabels.length > 0 && (
            <p className="remediation__focus">
              Let's focus on: <strong>{conceptLabels.join(', ')}</strong>.
            </p>
          )}
          <p className="remediation__reply">
            {tutorLoading ? 'Thinking through the best way to explain this…' : tutorReply}
          </p>
          {!tutorLoading && (tutorDiagram || intro) && (
            <div className="remediation__figure">
              {tutorDiagram ? (
                <TutorDiagram diagram={tutorDiagram} />
              ) : intro ? (
                <LessonIntroFigure intro={intro} />
              ) : null}
            </div>
          )}
          <button
            type="button"
            className="button button--primary"
            disabled={tutorLoading}
            onClick={() => setStep('practice')}
          >
            Start practice
          </button>
        </div>
      )}

      {step === 'practice' &&
        (practiceQuestions.length > 0 ? (
          <PracticeRunner
            key={practiceAttempt}
            questions={practiceQuestions}
            lessonId={lessonId}
            onComplete={(answers) => void handlePracticeComplete(answers)}
          />
        ) : (
          // No generatable practice for this lesson — don't trap the learner; let them finish.
          <div className="remediation__card">
            <p className="remediation__reply">
              You're all set to keep going. Review the lesson anytime to strengthen these concepts.
            </p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => void handlePracticeComplete([])}
            >
              Continue
            </button>
          </div>
        ))}

      {step === 'done' && (
        <div className="lesson-complete__card remediation__done-card">
          <div className="celebrate-badge celebrate-badge--proficient" aria-hidden="true">
            🎯
          </div>
          <h2 className="lesson-complete__title">Great practice — now retake the skill check</h2>
          <p className="lesson-complete__subtitle">
            You finished your personalized review of “{lessonTitle}”. Retake the skill check to
            unlock the next lesson.
          </p>
          <p className="lesson-complete__note muted">
            We'll keep an eye on{' '}
            {conceptLabels.length > 0 ? conceptLabels.join(', ') : 'these concepts'} and bring them
            back for a quick refresher later.
          </p>
          <div className="lesson-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void handleRetryPractice()}
            >
              Retry practice
            </button>
            <Link to="/dashboard" className="button button--secondary">
              Back to dashboard
            </Link>
            <Link to={`/skill-check/${lessonId}`} className="button button--primary">
              Retake skill check
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
