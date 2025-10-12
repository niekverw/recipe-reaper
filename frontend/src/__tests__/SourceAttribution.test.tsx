import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SourceAttribution } from '../components/SourceAttribution'

describe('SourceAttribution Component', () => {
  it('should render source attribution with hostname', () => {
    const sourceUrl = 'https://www.example.com/recipe/123'
    render(<SourceAttribution sourceUrl={sourceUrl} />)
    
    expect(screen.getByText(/Recipe adapted from/i)).toBeInTheDocument()
    expect(screen.getByText('www.example.com')).toBeInTheDocument()
  })

  it('should render link with correct href', () => {
    const sourceUrl = 'https://www.example.com/recipe/123'
    render(<SourceAttribution sourceUrl={sourceUrl} />)
    
    const link = screen.getByRole('link', { name: 'www.example.com' })
    expect(link).toHaveAttribute('href', sourceUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should not render anything when sourceUrl is null', () => {
    const { container } = render(<SourceAttribution sourceUrl={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render anything when sourceUrl is undefined', () => {
    const { container } = render(<SourceAttribution sourceUrl={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('should handle malformed URLs gracefully', () => {
    const sourceUrl = 'example.com/recipe'
    render(<SourceAttribution sourceUrl={sourceUrl} />)
    
    expect(screen.getByText(/Recipe adapted from/i)).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const sourceUrl = 'https://www.example.com'
    const { container } = render(<SourceAttribution sourceUrl={sourceUrl} className="custom-class" />)
    
    const paragraph = container.querySelector('p')
    expect(paragraph).toHaveClass('custom-class')
  })
})
