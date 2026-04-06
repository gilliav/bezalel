export function PageHeader({ title, action }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {action && <div>{action}</div>}
    </header>
  )
}
