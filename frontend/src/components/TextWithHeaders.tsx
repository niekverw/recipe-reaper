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
          return (
            <span key={index}>
              {segment.content}
            </span>
          )
        }
      })}
    </div>
  )
}