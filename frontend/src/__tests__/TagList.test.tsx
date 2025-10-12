import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagList } from '../components/TagList'

describe('TagList Component', () => {
  it('should render tags', () => {
    const tags = ['Italian', 'Pasta', 'Quick']
    render(<TagList tags={tags} />)
    
    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('Quick')).toBeInTheDocument()
  })

  it('should not render anything when tags array is empty', () => {
    const { container } = render(<TagList tags={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should limit displayed tags when maxDisplay is set', () => {
    const tags = ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']
    render(<TagList tags={tags} maxDisplay={3} />)
    
    expect(screen.getByText('Tag1')).toBeInTheDocument()
    expect(screen.getByText('Tag2')).toBeInTheDocument()
    expect(screen.getByText('Tag3')).toBeInTheDocument()
    expect(screen.queryByText('Tag4')).not.toBeInTheDocument()
    expect(screen.queryByText('Tag5')).not.toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('should call onTagClick when tag is clicked', async () => {
    const handleClick = vi.fn()
    const tags = ['Italian', 'Pasta']
    const user = userEvent.setup()
    
    render(<TagList tags={tags} onTagClick={handleClick} />)
    
    await user.click(screen.getByText('Italian'))
    expect(handleClick).toHaveBeenCalledWith('Italian')
  })

  it('should not call onTagClick when it is not provided', async () => {
    const tags = ['Italian', 'Pasta']
    const user = userEvent.setup()
    
    render(<TagList tags={tags} />)
    
    const button = screen.getByText('Italian')
    expect(button).toBeDisabled()
  })
})
