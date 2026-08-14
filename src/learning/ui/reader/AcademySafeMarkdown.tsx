import type { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function glossaryLinks(markdown: string): string {
  return markdown.replace(/\{\{term:([^}]+)\}\}/g, (_match, termId: string) =>
    `[${termId}](#/learning/glossary?term=${encodeURIComponent(termId)})`)
}

function safeUrl(url: string): string {
  const value = url.trim()
  if (/^(?:https?:|mailto:|#\/|\/|\.\/|\.\.\/)/i.test(value)) return value
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return value
  return ''
}

function SafeLink({ href = '', children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const external = /^https?:\/\//i.test(href)
  return (
    <a {...props} href={safeUrl(href)} {...(external ? { rel: 'noreferrer noopener', target: '_blank' } : {})}>
      {children}
    </a>
  )
}

function SafeImage({ src = '', alt = '', ...props }: ComponentPropsWithoutRef<'img'>) {
  const runtimeSource = /^(?:\/(?!\/)|\.\.?\/)/.test(src) ? src : ''
  if (!runtimeSource) return <span role="note">Visual externo no incorporado: {alt || 'sin descripción disponible'}</span>
  return <img {...props} src={runtimeSource} alt={alt} loading="lazy" />
}

export function AcademySafeMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="academy-reader-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={['script', 'style', 'iframe', 'object', 'embed', 'form', 'input']}
        unwrapDisallowed
        urlTransform={safeUrl}
        components={{ a: SafeLink, img: SafeImage }}
      >
        {glossaryLinks(markdown)}
      </ReactMarkdown>
    </div>
  )
}
