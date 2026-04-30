import { Link } from 'react-router-dom'
import { TimelineMilestone } from './TimelineMilestone'
import {formatDateHe, formatDateShort} from '../../utils/dates';

export function TimelineProject({ project, milestones, index, isExpanded, onToggle }) {
  return (
    <div className="relative">
      <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />
      <Link to={`/projects/${project.id}`}
        className="relative flex items-center gap-3 py-2 w-full text-right"
      >
        <div className="flex items-baseline gap-6 bg-muted rounded-xl px-4 py-2">
          <span className="text-primary text-sm text-muted-foreground ">{formatDateShort(project.dueDate ?? milestones[0]?.dueDate)}</span>
          <span className="text-base font-medium text-foreground">{project.title}</span>
        </div>
      </Link>
    </div>
  )
}
