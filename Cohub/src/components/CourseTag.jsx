import { Link } from 'react-router-dom'

const tagStyle = (color) => ({
  fontSize: '11px',
  fontWeight: 600,
  paddingBottom: '1px',
  borderBottom: `1.5px solid ${color}`,
  color,
  display: 'inline-block',
  lineHeight: 1.4,
})

export function CourseTag({ name, color, to }) {
  if (to) {
    return (
      <Link to={to} style={tagStyle(color)}>
        {name}
      </Link>
    )
  }
  return (
    <span style={tagStyle(color)}>
      {name}
    </span>
  )
}
