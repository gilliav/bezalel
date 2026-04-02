import { useState, useMemo } from 'react'
import { TimelineProject } from './TimelineProject'

export function Timeline({ projects, milestones }) {
  const now = new Date()

  const milestonesByProject = useMemo(() => {
    const map = {}
    for (const m of milestones) {
      if (!map[m.projectId]) map[m.projectId] = []
      map[m.projectId].push(m)
    }
    return map
  }, [milestones])

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aMs = milestonesByProject[a.id] ?? []
      const bMs = milestonesByProject[b.id] ?? []
      const aEarliest = aMs[0]?.dueDate?.toDate()?.getTime() ?? Infinity
      const bEarliest = bMs[0]?.dueDate?.toDate()?.getTime() ?? Infinity
      return aEarliest - bEarliest
    })
  }, [projects, milestonesByProject])

  const defaultExpandedId = useMemo(() => {
    const active = sortedProjects.find(p =>
      (milestonesByProject[p.id] ?? []).some(m => m.dueDate.toDate() > now),
    )
    return active?.id ?? sortedProjects[sortedProjects.length - 1]?.id ?? null
  }, [sortedProjects, milestonesByProject])

  const [expandedId, setExpandedId] = useState(defaultExpandedId)

  function handleToggle(id) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="pr-4 text-right">
      {sortedProjects.map((project, index) => (
        <TimelineProject
          key={project.id}
          project={project}
          milestones={milestonesByProject[project.id] ?? []}
          index={index}
          isExpanded={expandedId === project.id}
          onToggle={() => handleToggle(project.id)}
        />
      ))}
    </div>
  )
}
