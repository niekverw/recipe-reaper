import { TextHeaderParser } from '../utils/textHeaderParser'

interface TextWithHeadersProps {
  text: string
  className?: string
}

export default function TextWithHeaders({ text, className = '' }: TextWithHeadersProps) {
  if (!text) return null

  const segments = TextHeaderParser.parseText(text)

  if (segments.length === 0) return null

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'header') {
          return (
            <strong
              key={index}
              className="font-semibold text-gray-900 dark:text-white block mb-2 mt-4 first:mt-0"
            >
              {segment.content}
            </strong>
          )
        } else {
          // Split text into paragraphs (double newlines) and preserve single newlines within paragraphs
          const normalizedContent = segment.content.trim()
          const paragraphs = normalizedContent.split(/\n\s*\n+/)

          return (
            <div key={index}>
              {paragraphs.map((paragraph, paragraphIndex) => {
                const trimmedParagraph = paragraph.trim()
                if (!trimmedParagraph) return null

                return (
                  <p key={paragraphIndex} className={paragraphIndex > 0 ? "mt-4" : ""}>
                    {trimmedParagraph.split('\n').map((line, lineIndex, lines) => (
                      <span key={lineIndex}>
                        {line}
                        {lineIndex < lines.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                )
              })}
            </div>
          )
        }
      })}
    </div>
  )
}