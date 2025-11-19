import React from 'react'

/**
 * Simple and secure markdown renderer for AI-generated narratives
 * Only handles basic formatting to prevent XSS attacks
 * Supports: **bold**, *italic*, - bullet points, numbered lists
 */

interface MarkdownProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownProps) {
  const renderLine = (line: string, index: number) => {
    // Handle bullet points
    if (line.trim().startsWith('- ')) {
      const text = line.trim().substring(2)
      return (
        <li key={index} className="ml-4">
          {formatInlineMarkdown(text)}
        </li>
      )
    }

    // Handle numbered lists (1. 2. 3. etc.)
    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)$/)
    if (numberedMatch) {
      const text = numberedMatch[2]
      return (
        <li key={index} className="ml-4" style={{ listStyleType: 'decimal' }}>
          {formatInlineMarkdown(text)}
        </li>
      )
    }

    // Handle headings
    if (line.trim().startsWith('## ')) {
      return (
        <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
          {formatInlineMarkdown(line.trim().substring(3))}
        </h3>
      )
    }

    if (line.trim().startsWith('# ')) {
      return (
        <h2 key={index} className="text-xl font-bold mt-4 mb-2">
          {formatInlineMarkdown(line.trim().substring(2))}
        </h2>
      )
    }

    // Regular paragraph
    if (line.trim()) {
      return (
        <p key={index} className="mb-3">
          {formatInlineMarkdown(line)}
        </p>
      )
    }

    // Empty line
    return <br key={index} />
  }

  const formatInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      // Try to match **bold**
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)$/)
      if (boldMatch) {
        if (boldMatch[1]) {
          parts.push(<span key={key++}>{escapeHtml(boldMatch[1])}</span>)
        }
        parts.push(
          <strong key={key++} className="font-semibold">
            {escapeHtml(boldMatch[2])}
          </strong>
        )
        remaining = boldMatch[3]
        continue
      }

      // Try to match *italic* (but not part of **)
      const italicMatch = remaining.match(/^(.*?)\*([^*]+?)\*(.*)$/)
      if (italicMatch && !remaining.match(/^\*\*/)) {
        if (italicMatch[1]) {
          parts.push(<span key={key++}>{escapeHtml(italicMatch[1])}</span>)
        }
        parts.push(
          <em key={key++} className="italic">
            {escapeHtml(italicMatch[2])}
          </em>
        )
        remaining = italicMatch[3]
        continue
      }

      // No more markdown, add remaining text
      parts.push(<span key={key++}>{escapeHtml(remaining)}</span>)
      break
    }

    return <>{parts}</>
  }

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (char) => map[char])
  }

  const lines = content.split('\n')

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  )
}
