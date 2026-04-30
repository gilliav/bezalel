// src/components/DashboardItem.jsx
import { Link } from 'react-router-dom'
import { ChevronsLeftIcon } from 'lucide-react'
import { isOverdue } from '../utils/dates'
import { Tag } from './ui/tag'
import { DateTag } from './DateTag'
import { ProgressIndicator } from './ProgressIndicator'

export function DashboardItem({ item, course, progressStatus = 'not_started', onProgressSelect, onSignInPrompt }) {
  const overdue = isOverdue(item.dueDate)
  const isMilestone = Boolean(item.projectTitle)

  return (
    <div
      className={`flex flex-row justify-between gap-1 border-primary list-row-stacked ${overdue ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-col gap-1">
        <Link to={`/projects/${item.projectId}`} className="col-span-2">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0 min-w-0">
            {isMilestone ? (
              <>
                <p className="font-display font-bold text-base text-foreground leading-tight">
                  {item.projectTitle}
                </p>
                <ChevronsLeftIcon className="size-3 shrink-0" />
                <p className="text-base text-foreground leading-tight">
                  {item.title}
                </p>
              </>
            ) : (
              <p className="font-display font-bold text-base text-foreground leading-tight">
                {item.title}
              </p>
            )}
          </div>
        </Link>
        {course && <Tag className="text-base w-max px-1 leading-none" value={course.name} color={course.color} />}
      </div>
      <div className="flex items-center gap-2">
        <p className={`flex min-w-fit gap-1 justify-end items-center ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
          <DateTag dueDate={item.dueDate} includeRelative />
        </p>
        <ProgressIndicator
          status={progressStatus}
          onSelect={onProgressSelect}
          onSignInPrompt={onSignInPrompt}
        />
      </div>
    </div>
  )
}
