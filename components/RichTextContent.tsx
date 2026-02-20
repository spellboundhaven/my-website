'use client'

import { useEffect, useRef } from 'react'

interface RichTextContentProps {
  html: string
  className?: string
}

/**
 * Renders Quill editor HTML with proper text wrapping.
 *
 * Quill wraps text in inline <span> elements (often splitting a single word
 * across multiple spans). Browsers treat each span as an independent inline
 * box, so they can break a word like "driveway" into "d" + "riveway" at a
 * line edge. This component uses the browser's own DOMParser to unwrap all
 * <span> elements, merging their text back into the parent so the browser
 * sees whole words and wraps them naturally at any container width.
 */
export default function RichTextContent({ html, className = '' }: RichTextContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !html) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const unwrapSpans = (root: Element) => {
      const spans = Array.from(root.querySelectorAll('span'))
      for (let i = spans.length - 1; i >= 0; i--) {
        const span = spans[i]
        const parent = span.parentNode
        if (!parent) continue
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span)
        }
        parent.removeChild(span)
      }
    }

    unwrapSpans(doc.body)
    doc.body.normalize()

    // Replace non-breaking spaces (&nbsp; / \u00A0) with regular spaces.
    // Quill stores &nbsp; instead of normal spaces, which tells the browser
    // "do not break here" — making entire paragraphs one unbreakable line.
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      if (node.nodeValue) {
        node.nodeValue = node.nodeValue.replace(/\u00A0/g, ' ')
      }
    }

    containerRef.current.innerHTML = doc.body.innerHTML
  }, [html])

  return (
    <div
      ref={containerRef}
      className={`rental-terms-content ${className}`}
    />
  )
}
