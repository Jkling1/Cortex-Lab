import Anthropic from '@anthropic-ai/sdk'
import { LessonDefinition, GeneratedLesson, UserState } from '../../curriculum/types'
import { tiers } from '../../curriculum/tiers'

export async function generateLesson(
  lessonDef: LessonDefinition,
  userState: UserState,
  apiKey: string
): Promise<GeneratedLesson> {
  const client = new Anthropic({ apiKey })

  const tier = tiers.find(t => t.id === lessonDef.tierId)
  const completedCount = userState.currentLessonOrder - 1

  const systemPrompt = `You are Cortex, a brilliant and patient AI professor teaching a motivated student who wants to genuinely understand AI and machine learning — not just use tools, but understand what's happening underneath.

Your teaching style:
- Start with an engaging hook or real-world example
- Build concepts from first principles
- Use concrete analogies that connect to things the student already knows
- Include code snippets (Python) when they help illustrate a concept
- Be thorough but never boring — every paragraph should earn its place
- Connect each concept to the bigger picture of the AI field

The student is currently in Tier ${lessonDef.tierId}: "${tier?.name}" and has completed ${completedCount} of ${tier?.lessons.length} lessons in this tier.`

  const userPrompt = `Generate a complete lesson for:

**Title:** ${lessonDef.title}
**Description:** ${lessonDef.description}

**Key Concepts to Cover:** ${lessonDef.concepts.join(', ')}

**Learning Objectives — by the end, the student should be able to:**
${lessonDef.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

**Estimated reading time:** ${lessonDef.estimatedMinutes} minutes

Format your response as follows:

1. Start with a brief, engaging introduction (2-3 paragraphs)
2. Cover each concept thoroughly with explanations and examples
3. Include Python code snippets where helpful (use \`\`\`python blocks)
4. End with a "Key Takeaways" section (bullet points)
5. End with a "Review Questions" section (3 questions to test understanding)

Use markdown formatting throughout. Make it feel like a great textbook chapter, not a Wikipedia article.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })

  const content = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')

  // Parse key takeaways and review questions from the content
  const takeaways = extractSection(content, 'Key Takeaways')
  const questions = extractSection(content, 'Review Questions')

  return {
    lessonDefId: lessonDef.id,
    content,
    keyTakeaways: takeaways,
    reviewQuestions: questions,
    generatedAt: new Date().toISOString()
  }
}

function extractSection(content: string, heading: string): string[] {
  const regex = new RegExp(`##?\\s*${heading}[\\s\\S]*?(?=##|$)`, 'i')
  const match = content.match(regex)
  if (!match) return []

  const lines = match[0].split('\n')
  return lines
    .filter(line => /^[\s]*[-*\d]/.test(line))
    .map(line => line.replace(/^[\s]*[-*\d.]+\s*/, '').trim())
    .filter(Boolean)
}
