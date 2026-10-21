import { render } from '@testing-library/react'
import { CourseIcon } from './CourseIcon'

it('masks the course subject icon in the course color', () => {
  const { container } = render(<CourseIcon course={{ name: 'סיפור', color: '#457B9D' }} />)
  const icon = container.querySelector('.course-icon')
  expect(icon.style.getPropertyValue('--icon')).toMatch(/book\.svg/)
  expect(icon).toHaveStyle({ backgroundColor: '#457B9D' })
  expect(icon).toHaveAttribute('aria-hidden', 'true')
})

it('merges extra classes', () => {
  const { container } = render(<CourseIcon course={{ name: 'גריד' }} className="mt-0.5" />)
  expect(container.querySelector('.course-icon')).toHaveClass('mt-0.5')
})
