import { useState } from 'react'
import { formatDue, validateDueDate } from '../utils/dates'
import { getStatus } from '../utils/assignments'
import SubtaskPanel from './SubtaskPanel'

// One assignment card. It handles its own edit mode.
function AssignmentItem({ assignment, onToggle, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(assignment)
  const [error, setError] = useState('')

  const a = assignment

  function startEditing() {
    setDraft({ ...assignment, dueTime: assignment.dueTime || '' })
    setError('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setError('')
  }

  function updateDraft(field, value) {
    setDraft({ ...draft, [field]: value })
    if (field === 'dueDate' || field === 'dueTime') setError('')
  }

  function handleSave(event) {
    event.preventDefault()
    if (!draft.title.trim()) return

    if (draft.dueTime && !draft.dueDate) {
      setError('Pick a due date to go with the time.')
      return
    }

    // Only check the date if it was changed
    const dateError =
      draft.dueDate !== assignment.dueDate ? validateDueDate(draft.dueDate) : ''
    if (dateError) {
      setError(dateError)
      return
    }

    onSave({ ...draft, title: draft.title.trim(), course: draft.course.trim() })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <li className="editing">
        <form onSubmit={handleSave} className="assignment-form">
          <div className="field">
            <label htmlFor={`edit-title-${a.id}`}>Title (required)</label>
            <input
              id={`edit-title-${a.id}`}
              value={draft.title}
              onChange={(e) => updateDraft('title', e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor={`edit-course-${a.id}`}>Course</label>
            <input
              id={`edit-course-${a.id}`}
              value={draft.course}
              onChange={(e) => updateDraft('course', e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor={`edit-date-${a.id}`}>Due date</label>
              <input
                id={`edit-date-${a.id}`}
                type="date"
                value={draft.dueDate}
                onChange={(e) => updateDraft('dueDate', e.target.value)}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? `edit-date-error-${a.id}` : undefined}
              />
            </div>

            <div className="field">
              <label htmlFor={`edit-time-${a.id}`}>Due time (optional)</label>
              <input
                id={`edit-time-${a.id}`}
                type="time"
                value={draft.dueTime}
                onChange={(e) => updateDraft('dueTime', e.target.value)}
                aria-describedby={error ? `edit-date-error-${a.id}` : undefined}
              />
            </div>
          </div>

          {error && (
            <p id={`edit-date-error-${a.id}`} className="error" role="alert">
              {error}
            </p>
          )}

          <div className="field">
            <label htmlFor={`edit-priority-${a.id}`}>Priority</label>
            <select
              id={`edit-priority-${a.id}`}
              value={draft.priority}
              onChange={(e) => updateDraft('priority', e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="actions">
            <button type="submit" className="primary">Save changes</button>
            <button type="button" onClick={cancelEditing}>Cancel</button>
          </div>
        </form>
      </li>
    )
  }

  const status = getStatus(a)
  const priorityClass = a.priority.toLowerCase()

  return (
    <li className={`assignment-card edge-${priorityClass}${a.completed ? ' done' : ''}`}>
      <div className="assignment-row">
        <input
          type="checkbox"
          id={`done-${a.id}`}
          checked={a.completed}
          onChange={() => onToggle(a.id)}
        />

        <div className="assignment-info">
          <div className="assignment-top">
            <label htmlFor={`done-${a.id}`} className="assignment-title">
              {a.title}
            </label>
            {status && <span className={`badge ${status.className}`}>{status.label}</span>}
          </div>

          <p className="details">
            {a.course && <span className="course-chip">{a.course}</span>}
            <span>{formatDue(a.dueDate, a.dueTime)}</span>
            <span className={`priority priority-${priorityClass}`}>{a.priority} priority</span>
          </p>
        </div>

        <div className="item-actions">
          <button
            type="button"
            className="small"
            onClick={startEditing}
            aria-label={`Edit ${a.title}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="small"
            onClick={() => onDelete(a.id)}
            aria-label={`Delete ${a.title}`}
          >
            Delete
          </button>
        </div>
      </div>

      <SubtaskPanel assignment={a} onSave={onSave} />
    </li>
  )
}

export default AssignmentItem