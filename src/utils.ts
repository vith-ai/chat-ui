/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Parse SSE stream
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<{ event?: string; data: string }> {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let currentEvent: string | undefined
    let currentData = ''

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        currentData = line.slice(5).trim()
      } else if (line === '' && currentData) {
        yield { event: currentEvent, data: currentData }
        currentEvent = undefined
        currentData = ''
      }
    }
  }
}

/**
 * Create an AbortController with timeout
 */
export function createAbortController(timeoutMs?: number): {
  controller: AbortController
  cleanup: () => void
} {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  if (timeoutMs) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  }

  return {
    controller,
    cleanup: () => {
      if (timeoutId) clearTimeout(timeoutId)
    },
  }
}
