import { Link } from 'react-router-dom'
import { TimelineMilestone } from './TimelineMilestone'

export function TimelineProject({ project, milestones, index, isExpanded, onToggle }) {
  return (
    <div className="relative pr-4">
      {/* vertical line */}
      <div className="absolute right-4 top-0 bottom-0 w-px bg-gray-200" />

      <button
        onClick={onToggle}
        className="relative flex items-center gap-3 py-3 w-full text-right"
      >
        {/* dot */}
        <div className={`absolute right-3 w-3 h-3 rounded-full border-2 border-white z-10 ${isExpanded ? 'bg-blue-500' : 'bg-gray-300'}`} />
        <div className="pr-6">
          <span className="text-xs text-gray-400 ml-1">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-sm font-medium text-gray-900">{project.title}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="pb-2">
          {milestones.map(m => (
            <TimelineMilestone key={m.id} milestone={m} />
          ))}
          <Link
            to={`/projects/${project.id}`}
            className="block pr-6 mt-2 text-xs text-blue-600"
          >
            פתח פרויקט ←
          </Link>
        </div>
      )}
    </div>
  )
}
