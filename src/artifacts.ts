import type { ReactNode } from 'react'
import type { Artifact, ArtifactType, ArtifactRenderer } from './types'

/**
 * Registry for artifact renderers
 * Register custom renderers for different artifact types
 */
export class ArtifactRegistry {
  private renderers: ArtifactRenderer[] = []

  /**
   * Register a custom artifact renderer
   * Later registrations take priority for matching types
   */
  register(renderer: ArtifactRenderer): void {
    this.renderers.unshift(renderer)
  }

  /**
   * Get the appropriate renderer for an artifact
   */
  getRenderer(artifact: Artifact): ArtifactRenderer | null {
    for (const renderer of this.renderers) {
      // Check custom canRender first
      if (renderer.canRender && renderer.canRender(artifact)) {
        return renderer
      }
      // Fall back to type matching
      if (renderer.types.includes(artifact.type)) {
        return renderer
      }
    }
    return null
  }

  /**
   * Render an artifact using registered renderers
   * Returns null if no renderer found
   */
  render(artifact: Artifact): ReactNode | null {
    const renderer = this.getRenderer(artifact)
    if (!renderer) return null
    return renderer.render(artifact)
  }

  /**
   * Check if an artifact can be rendered
   */
  canRender(artifact: Artifact): boolean {
    return this.getRenderer(artifact) !== null
  }

  /**
   * Get all registered renderer types
   */
  getSupportedTypes(): ArtifactType[] {
    const types = new Set<ArtifactType>()
    for (const renderer of this.renderers) {
      for (const type of renderer.types) {
        types.add(type)
      }
    }
    return Array.from(types)
  }
}

/**
 * Default artifact registry instance
 */
export const defaultArtifactRegistry = new ArtifactRegistry()

/**
 * Helper to detect artifact type from content or filename
 */
export function detectArtifactType(
  content: string,
  filename?: string,
  mimeType?: string
): ArtifactType {
  // Check MIME type first
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType === 'text/html') return 'html'
    if (mimeType === 'text/csv') return 'csv'
    if (mimeType === 'application/json') return 'json'
    if (mimeType === 'text/markdown') return 'markdown'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet'
  }

  // Check filename extension
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'md':
      case 'markdown':
        return 'markdown'
      case 'html':
      case 'htm':
        return 'html'
      case 'csv':
        return 'csv'
      case 'json':
        return 'json'
      case 'pdf':
        return 'pdf'
      case 'xlsx':
      case 'xls':
        return 'spreadsheet'
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
        return 'image'
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
      case 'py':
      case 'rb':
      case 'go':
      case 'rs':
      case 'java':
      case 'c':
      case 'cpp':
      case 'cs':
      case 'php':
      case 'swift':
      case 'kt':
      case 'sql':
      case 'sh':
      case 'bash':
      case 'yaml':
      case 'yml':
      case 'toml':
      case 'xml':
      case 'css':
      case 'scss':
      case 'less':
        return 'code'
    }
  }

  // Try to detect from content
  if (content.startsWith('<!DOCTYPE html') || content.startsWith('<html')) return 'html'
  if (content.startsWith('{') || content.startsWith('[')) {
    try {
      JSON.parse(content)
      return 'json'
    } catch {
      // Not valid JSON
    }
  }
  if (content.includes('\n') && content.split('\n').every(line => line.includes(','))) {
    return 'csv'
  }

  // Default to code
  return 'code'
}

/**
 * Create an artifact object with auto-detected type
 */
export function createArtifact(
  content: string,
  options: {
    id?: string
    title?: string
    type?: ArtifactType
    language?: string
    filename?: string
    mimeType?: string
    metadata?: Record<string, unknown>
  } = {}
): Artifact {
  const {
    id = `artifact-${Date.now()}`,
    title = options.filename || 'Untitled',
    type = detectArtifactType(content, options.filename, options.mimeType),
    language,
    mimeType,
    metadata,
  } = options

  return {
    id,
    type,
    title,
    content,
    language,
    mimeType,
    metadata,
  }
}
