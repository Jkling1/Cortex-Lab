import Anthropic from '@anthropic-ai/sdk'
import { LessonDefinition, LabDefinition } from '../../curriculum/types'
import { tiers } from '../../curriculum/tiers'

export async function generateTierCurriculum(
  tierId: number,
  apiKey: string
): Promise<{ lessons: LessonDefinition[]; labs: LabDefinition[] }> {
  const client = new Anthropic({ apiKey })
  const tier = tiers.find(t => t.id === tierId)
  if (!tier) throw new Error(`Tier ${tierId} not found`)

  const prereqNames = tier.prerequisites.map(pid => {
    const p = tiers.find(t => t.id === pid)
    return p ? `Tier ${pid}: ${p.name}` : `Tier ${pid}`
  }).join(', ')

  const prompt = `You are designing the lesson curriculum for an AI/ML learning app. Generate lesson and lab definitions for:

**Tier ${tierId}: ${tier.name}**
**Description:** ${tier.description}
**Estimated hours:** ${tier.estimatedHours}
**Prerequisites completed:** ${prereqNames || 'None'}

Generate a JSON object with two arrays: "lessons" and "labs".

**Lessons** (generate 8-12 lessons): Each lesson should be a JSON object with:
- "id": string in format "t${tierId}-001", "t${tierId}-002", etc.
- "tierId": ${tierId}
- "title": string (clear, specific lesson title)
- "description": string (1-2 sentences, what the student will learn)
- "order": number (sequential starting at 1)
- "concepts": string[] (3-6 key concepts covered)
- "objectives": string[] (3-4 learning objectives starting with action verbs)
- "estimatedMinutes": number (20-45 minutes each)

**Labs** (generate 2-3 hands-on labs): Each lab should be a JSON object with:
- "id": string in format "lab-t${tierId}-001", etc.
- "tierId": ${tierId}
- "title": string
- "description": string
- "difficulty": "guided" | "build" | "freeform" (progress from easier to harder)
- "relatedLessonIds": string[] (IDs of lessons this lab connects to)
- "estimatedMinutes": number (25-45)
- "prerequisites": string[] (IDs of labs that should be done first, can be empty)
- "setupInstructions": string (what packages/tools are needed)
- "exercises": array of exercise objects, each with:
  - "id": string (e.g., "lab-t${tierId}-001-ex1")
  - "instructions": string (what to implement)
  - "starterCode": string (Python code with placeholders)
  - "solution": string (complete working Python code)
  - "hints": string[] (2-3 hints)
  - "validationCode": string (Python code that tests the solution — must print "PASS" on success, use assert statements)

**Important rules for labs:**
- Starter code should have "# Your code here" or "pass" placeholders
- Validation code runs AFTER the user's code in the same script
- Validation must end with print("PASS") if all assertions pass
- Keep exercises focused — test one concept each
- Each lab should have 2-3 exercises

**Design the curriculum to:**
1. Build concepts progressively (each lesson builds on the previous)
2. Cover the full scope of "${tier.name}" as described
3. Balance theory and practice
4. Include Python code examples where relevant
5. Connect to real-world applications

Respond with ONLY the JSON object, no markdown fences, no explanations. The JSON must be valid and parseable.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')

  // Parse JSON from response, handling potential markdown fences
  const jsonStr = text.replace(/^```json?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const parsed = JSON.parse(jsonStr)

  const lessons: LessonDefinition[] = (parsed.lessons || []).map((l: Record<string, unknown>) => ({
    id: l.id as string,
    tierId,
    title: l.title as string,
    description: l.description as string,
    order: l.order as number,
    concepts: l.concepts as string[],
    objectives: l.objectives as string[],
    estimatedMinutes: l.estimatedMinutes as number
  }))

  const labs: LabDefinition[] = (parsed.labs || []).map((l: Record<string, unknown>) => ({
    id: l.id as string,
    tierId,
    title: l.title as string,
    description: l.description as string,
    difficulty: l.difficulty as LabDefinition['difficulty'],
    relatedLessonIds: l.relatedLessonIds as string[],
    estimatedMinutes: l.estimatedMinutes as number,
    prerequisites: l.prerequisites as string[],
    setupInstructions: l.setupInstructions as string,
    exercises: ((l.exercises as Record<string, unknown>[]) || []).map((ex: Record<string, unknown>) => ({
      id: ex.id as string,
      instructions: ex.instructions as string,
      starterCode: ex.starterCode as string,
      solution: ex.solution as string,
      hints: ex.hints as string[],
      validationCode: ex.validationCode as string
    }))
  }))

  return { lessons, labs }
}
