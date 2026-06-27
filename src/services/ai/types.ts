import type { QuestionType } from '../../types/lesson'

/**
 * Where an AI response came from:
 * - `ai`       a real model (the Cloud Function / OpenAI) answered.
 * - `mock`     the local deterministic mock provider answered (no network).
 * - `fallback` the call failed and a service returned a safe static response.
 */
export type AiSource = 'ai' | 'mock' | 'fallback'

export type AiRequestKind = 'feedback' | 'tutor' | 'practice'

// ---------------------------------------------------------------------------
// Feature 1: personalized feedback on a specific mistake
// ---------------------------------------------------------------------------

export interface AiFeedbackRequest {
  questionId: string
  questionType: QuestionType
  prompt: string
  /** Concept tags for the question. Optional now; populated in Phase 2. */
  conceptTags?: string[]
  /** 1-based attempt count for this question when the answer was submitted. */
  attempts: number
  usedHint?: boolean
  /** Model-friendly description of what the learner submitted, e.g. "entered (2, 5)". */
  submittedSummary: string
  /** Model-friendly description of the correct answer, e.g. "(5, 2)". */
  correctSummary: string
  /** Optional structured payloads for richer diagnosis (e.g. the raw vectors). */
  submitted?: unknown
  correct?: unknown
  /**
   * Optional instruction steering what the feedback should focus on. Used to keep guided
   * addition/subtraction feedback about reading the drawn resultant vector rather than adding
   * components (a concept not yet taught at that point).
   */
  feedbackFocus?: string
}

export interface AiFeedbackResponse {
  message: string
  /** Concepts this mistake implicates, fed into the mastery profile in Phase 2+. */
  diagnosedConcepts?: string[]
  source: AiSource
}

// ---------------------------------------------------------------------------
// Feature 2: the always-available AI tutor (chat)
// ---------------------------------------------------------------------------

export interface AiTutorTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AiTutorContext {
  lessonId?: string
  /** Human-readable title of the current lesson, so the tutor can stay on the lesson's topic. */
  lessonTitle?: string
  questionId?: string
  questionPrompt?: string
  /** The canonical steps to solve the current question type, so the tutor stays on procedure. */
  solutionSteps?: string
  /** What the learner has done so far on the current question and the single next action to take. */
  progressNote?: string
  /**
   * Short summary of how the learner is doing in THIS lesson right now (e.g. struggling on the
   * current question, or breezing through), so the tutor can adjust its tone and depth.
   */
  lessonPerformance?: string
  /** Short text summary of the learner's mastery profile (Phase 2+). */
  masterySummary?: string
}

export interface AiTutorRequest {
  messages: AiTutorTurn[]
  context?: AiTutorContext
}

/** Named colors for tutor diagram vectors, mapped to the lesson's existing vector palette. */
export type TutorDiagramColor = 'a' | 'b' | 'sum' | 'muted'

export interface TutorDiagramVector {
  /** Vector components [x, y]. */
  tip: [number, number]
  /** Optional tail position (defaults to the origin). */
  origin?: [number, number]
  label?: string
  color?: TutorDiagramColor
  dashed?: boolean
}

/**
 * A small coordinate-plane figure the tutor can return instead of (or alongside) prose. Rendered
 * client-side with the same SVG plane/vector components the lessons use, so it matches the app.
 */
export interface TutorDiagram {
  caption?: string
  planeMin?: number
  planeMax?: number
  vectors: TutorDiagramVector[]
}

export interface AiTutorResponse {
  reply: string
  /** Optional figure to render with the reply (the tutor favors visuals over paragraphs). */
  diagram?: TutorDiagram
  source: AiSource
}

// ---------------------------------------------------------------------------
// Feature 5: personalized practice generation
//
// The AI only PROPOSES parameters for an existing authored question template. The app builds the
// real question from the template + these parameters and verifies it with the existing validators
// (Phase 4). The AI never invents new interaction types or answer keys.
// ---------------------------------------------------------------------------

export interface AiPracticeProposal {
  /** Id of an existing authored question to use as the template. */
  templateQuestionId: string
  /** Proposed numeric parameters (vectors/scalars), keyed by name. */
  parameters: Record<string, number | number[]>
}

export interface AiPracticeRequest {
  lessonId: string
  /** Concept tags to target (the learner's weak spots). */
  targetConcepts: string[]
  /** Candidate template question ids the AI may parameterize. */
  templateQuestionIds: string[]
  count: number
}

export interface AiPracticeResponse {
  proposals: AiPracticeProposal[]
  source: AiSource
}

// ---------------------------------------------------------------------------
// Provider contract — implemented by the mock (now) and the Cloud Function (later)
// ---------------------------------------------------------------------------

export interface AiProvider {
  readonly name: string
  getFeedback(request: AiFeedbackRequest): Promise<AiFeedbackResponse>
  chat(request: AiTutorRequest): Promise<AiTutorResponse>
  generatePractice(request: AiPracticeRequest): Promise<AiPracticeResponse>
}

export type AiProviderName = 'mock' | 'cloud'
