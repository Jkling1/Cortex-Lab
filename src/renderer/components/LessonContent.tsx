import React from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  content: string
}

export default function LessonContent({ content }: Props) {
  return (
    <div className="lesson-content">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const isInline = !className
            if (isInline) {
              return <code className="inline-code" {...props}>{children}</code>
            }
            return (
              <pre className="code-block">
                <code className={className} {...props}>{children}</code>
              </pre>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
