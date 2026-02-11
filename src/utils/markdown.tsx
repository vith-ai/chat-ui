import React from 'react'

/**
 * Lightweight markdown renderer - handles essentials without external dependencies.
 * Supports: headers, bold, italic, links, code blocks, inline code, lists, blockquotes, horizontal rules.
 *
 * Usage:
 *   import { renderMarkdown } from './utils/markdown'
 *   <div className="chat-md-content">{renderMarkdown(content)}</div>
 */

/**
 * Process inline markdown formatting (bold, italic, code, links)
 */
function processInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      result.push(
        <code key={key++} className="chat-md-inline-code">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/)
    if (boldMatch) {
      result.push(<strong key={key++}>{processInline(boldMatch[2])}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/)
    if (italicMatch) {
      result.push(<em key={key++}>{processInline(italicMatch[2])}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      result.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-md-link"
        >
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Plain text until next special character
    const plainMatch = remaining.match(/^[^`*_\[]+/)
    if (plainMatch) {
      result.push(plainMatch[0])
      remaining = remaining.slice(plainMatch[0].length)
      continue
    }

    // Single special char that didn't match patterns
    result.push(remaining[0])
    remaining = remaining.slice(1)
  }

  return result
}

/**
 * Render markdown content to React elements
 */
export function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block: ```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={key++} className="chat-md-code-wrapper">
          {lang && <div className="chat-md-code-lang">{lang}</div>}
          <pre className={`chat-md-code-block ${lang ? 'has-lang' : ''}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      i++
      continue
    }

    // Horizontal rule: ---, ***, ___
    if (/^([-*_])\1{2,}$/.test(line.trim())) {
      elements.push(<hr key={key++} className="chat-md-hr" />)
      i++
      continue
    }

    // Headers: # ## ### etc
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const Tag = `h${level}` as keyof JSX.IntrinsicElements
      elements.push(
        <Tag key={key++} className={`chat-md-h${level}`}>
          {processInline(headerMatch[2])}
        </Tag>
      )
      i++
      continue
    }

    // Blockquote: >
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      elements.push(
        <blockquote key={key++} className="chat-md-blockquote">
          {renderMarkdown(quoteLines.join('\n'))}
        </blockquote>
      )
      continue
    }

    // Unordered list: - or *
    if (/^[-*]\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={key++} className="chat-md-ul">
          {listItems.map((item, idx) => (
            <li key={idx}>{processInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list: 1. 2. etc
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={key++} className="chat-md-ol">
          {listItems.map((item, idx) => (
            <li key={idx}>{processInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    elements.push(
      <p key={key++} className="chat-md-p">
        {processInline(line)}
      </p>
    )
    i++
  }

  return elements
}

export default renderMarkdown
