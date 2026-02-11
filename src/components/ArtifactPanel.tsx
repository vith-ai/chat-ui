import React, { useState } from 'react'
import { clsx } from 'clsx'
import { Code, FileText, Image, Table, File, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Artifact, ArtifactType } from '../types'
import { renderMarkdown } from '../utils/markdown'
import type { ArtifactRegistry } from '../artifacts'

/**
 * ArtifactPanel - Display artifacts with built-in renderers
 *
 * BASIC USAGE (works out of the box):
 *   <ArtifactPanel artifacts={message.artifacts} />
 *
 * WITH CUSTOM RENDERERS:
 *   <ArtifactPanel
 *     artifacts={artifacts}
 *     renderers={{
 *       code: (artifact) => <SyntaxHighlighter>{artifact.content}</SyntaxHighlighter>,
 *       markdown: (artifact) => <ReactMarkdown>{artifact.content}</ReactMarkdown>,
 *     }}
 *   />
 *
 * Built-in renderers (no dependencies):
 *   - code: <pre><code> with basic styling
 *   - json: Pretty-printed JSON
 *   - csv: Basic HTML table
 *   - markdown: Headers, bold, italic, links, lists, code blocks, blockquotes
 *   - image: Native <img> tag
 *   - html: Sandboxed iframe
 *   - text/unknown: Plain text display
 */
export interface ArtifactPanelProps {
  /** Artifacts to display */
  artifacts?: Artifact[]
  /** Custom renderers by type (override built-in) */
  renderers?: Partial<Record<ArtifactType, (artifact: Artifact) => React.ReactNode>>
  /**
   * ArtifactRegistry instance for looking up renderers
   * If provided, registry renderers take priority over built-in, then fall back to `renderers` prop
   */
  registry?: ArtifactRegistry
  /** Currently selected artifact index */
  selectedIndex?: number
  /** Called when artifact selection changes */
  onSelect?: (index: number) => void
  /** Called when panel is closed */
  onClose?: () => void
  /** Show close button */
  showClose?: boolean
  /** Additional CSS classes */
  className?: string
}

// Icon mapping for artifact types
const typeIcons: Record<ArtifactType, React.ReactNode> = {
  code: <Code size={16} />,
  markdown: <FileText size={16} />,
  json: <Code size={16} />,
  csv: <Table size={16} />,
  spreadsheet: <Table size={16} />,
  chart: <Table size={16} />,
  table: <Table size={16} />,
  document: <FileText size={16} />,
  image: <Image size={16} />,
  html: <FileText size={16} />,
  pdf: <File size={16} />,
  custom: <File size={16} />,
}

// Built-in basic renderers (no external dependencies)
const builtInRenderers: Record<ArtifactType, (artifact: Artifact) => React.ReactNode> = {
  // Code: basic pre/code block
  code: (artifact) => (
    <pre className="chat-artifact-code">
      <code>{artifact.content}</code>
    </pre>
  ),

  // JSON: pretty-printed
  json: (artifact) => {
    let formatted = artifact.content
    try {
      formatted = JSON.stringify(JSON.parse(artifact.content), null, 2)
    } catch {
      // Use as-is if not valid JSON
    }
    return (
      <pre className="chat-artifact-code">
        <code>{formatted}</code>
      </pre>
    )
  },

  // CSV: basic table
  csv: (artifact) => {
    const rows = artifact.content.trim().split('\n').map(row => row.split(','))
    const [header, ...body] = rows
    return (
      <div className="chat-artifact-table-wrapper">
        <table className="chat-artifact-table">
          <thead>
            <tr>
              {header?.map((cell, i) => (
                <th key={i}>{cell.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },

  // Spreadsheet: same as CSV
  spreadsheet: (artifact) => builtInRenderers.csv(artifact),

  // Chart: placeholder (override with chart library)
  chart: (artifact) => (
    <div className="chat-artifact-markdown">
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{artifact.content}</pre>
    </div>
  ),

  // Table: same as CSV
  table: (artifact) => builtInRenderers.csv(artifact),

  // Document: rendered as markdown (documents often contain markdown formatting)
  document: (artifact) => (
    <div className="chat-artifact-markdown chat-md-content">
      {renderMarkdown(artifact.content)}
    </div>
  ),

  // Markdown: rendered with built-in lightweight parser
  markdown: (artifact) => (
    <div className="chat-artifact-markdown chat-md-content">
      {renderMarkdown(artifact.content)}
    </div>
  ),

  // Image: native img tag
  image: (artifact) => (
    <div className="chat-artifact-image">
      <img
        src={artifact.content}
        alt={artifact.title}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  ),

  // HTML: sandboxed iframe
  html: (artifact) => (
    <iframe
      className="chat-artifact-iframe"
      srcDoc={artifact.content}
      sandbox="allow-scripts"
      style={{ width: '100%', height: '400px', border: 'none', background: 'white' }}
      title={artifact.title}
    />
  ),

  // PDF: link to content (override with react-pdf for embedded viewing)
  pdf: (artifact) => (
    <div className="chat-artifact-pdf">
      <a href={artifact.content} target="_blank" rel="noopener noreferrer">
        Open PDF: {artifact.title}
      </a>
    </div>
  ),

  // Custom/unknown: plain text
  custom: (artifact) => (
    <pre className="chat-artifact-code">
      <code>{artifact.content}</code>
    </pre>
  ),
}

export function ArtifactPanel({
  artifacts = [],
  renderers = {},
  registry,
  selectedIndex: controlledIndex,
  onSelect,
  onClose,
  showClose = true,
  className,
}: ArtifactPanelProps) {
  const [internalIndex, setInternalIndex] = useState(0)

  // Support controlled and uncontrolled modes
  const selectedIndex = controlledIndex ?? internalIndex
  const setSelectedIndex = onSelect ?? setInternalIndex

  if (artifacts.length === 0) {
    return null
  }

  const currentArtifact = artifacts[selectedIndex] || artifacts[0]

  // Get renderer with priority: registry -> renderers prop -> built-in -> fallback
  const getRenderer = (artifact: Artifact): (artifact: Artifact) => React.ReactNode => {
    // Try registry first
    if (registry?.canRender(artifact)) {
      return (a) => registry.render(a)
    }
    // Then custom renderers prop
    if (renderers[artifact.type]) {
      return renderers[artifact.type]!
    }
    // Then built-in
    return builtInRenderers[artifact.type] || builtInRenderers.custom
  }

  const goToPrev = () => setSelectedIndex(Math.max(0, selectedIndex - 1))
  const goToNext = () => setSelectedIndex(Math.min(artifacts.length - 1, selectedIndex + 1))

  return (
    <div className={clsx('chat-artifact-panel', className)}>
      {/* Header with tabs/navigation */}
      <div className="chat-artifact-header">
        <div className="chat-artifact-tabs">
          {artifacts.length > 1 && (
            <button
              onClick={goToPrev}
              disabled={selectedIndex === 0}
              className="chat-artifact-nav-btn"
              aria-label="Previous artifact"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <button className="chat-artifact-tab chat-artifact-tab-active">
            {typeIcons[currentArtifact.type] || typeIcons.custom}
            <span className="chat-artifact-tab-title">{currentArtifact.title}</span>
            {artifacts.length > 1 && (
              <span className="chat-artifact-tab-count">
                {selectedIndex + 1}/{artifacts.length}
              </span>
            )}
          </button>

          {artifacts.length > 1 && (
            <button
              onClick={goToNext}
              disabled={selectedIndex === artifacts.length - 1}
              className="chat-artifact-nav-btn"
              aria-label="Next artifact"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {showClose && onClose && (
          <button onClick={onClose} className="chat-artifact-close" aria-label="Close">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="chat-artifact-content">
        {getRenderer(currentArtifact)(currentArtifact)}
      </div>
    </div>
  )
}

export default ArtifactPanel
