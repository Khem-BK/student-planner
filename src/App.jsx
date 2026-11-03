import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'student-planner-assignments'
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }
const DAYS_TO_KEEP_OVERDUE = 7
const MAX_DAYS_AHEAD = 730 // about 2 years
const TRASH_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000 // one day in milliseconds

function loadAssignments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const list = saved ? JSON.parse(saved) : []
    // Remove anything that has been in the trash longer than TRASH_DAYS
    const now = Date.now()
    return list.filter((a) => !a.deletedAt || now - a.deletedAt < TRASH_DAYS * DAY_MS)
  } catch {
    return []
  }
}

function toDateText(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayText() {
  return toDateText(new Date())
}

function addDays(dateText, days) {
  const date = new Date(dateText + 'T00:00')
  date.setDate(date.getDate() + days)
  return toDateText(date)
}

function formatDate(dateText) {
  if (!dateText) return 'No due date'
  return new Date(dateText + 'T00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function validateDueDate(dateText) {
  if (!dateText) return ''
  const today = todayText()
  if (dateText < addDays(today, -DAYS_TO_KEEP_OVERDUE)) {
    return `That date is more than ${DAYS_TO_KEEP_OVERDUE} days in the past. Please check the year.`
  }
  if (dateText > addDays(today, MAX_DAYS_AHEAD)) {
    return 'That date is more than 2 years away. Please check the year.'
  }
  return ''
}

function isOld(assignment) {
  return Boolean(
    assignment.dueDate &&
      assignment.dueDate < addDays(todayText(), -DAYS_TO_KEEP_OVERDUE)
  )
}

function getStatus(assignment) {
  if (assignment.completed || !assignment.dueDate) return null
  const today = todayText()
  if (assignment.dueDate < today) return { label: 'Overdue', className: 'badge-overdue' }
  if (assignment.dueDate === today) return { label: 'Due today', className: 'badge-today' }
  return null
}

// How many days until a trashed item is removed for good
function daysLeftInTrash(assignment) {
  const daysPassed = Math.floor((Date.now() - assignment.deletedAt) / DAY_MS)
  return Math.max(TRASH_DAYS - daysPassed, 1)
}

function sortAssignments(list, sortBy) {
  const copy = [...list]
  if (sortBy === 'dueDate') {
    copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })
  } else if (sortBy === 'priority') {
    copy.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  } else if (sortBy === 'course') {
    copy.sort((a, b) => a.course.localeCompare(b.course))
  }
  return copy
}

function App() {
  const [assignments, setAssignments] = useState(loadAssignments)

  // Add form
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [addError, setAddError] = useState('')

  // Editing
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [editError, setEditError] = useState('')

  // Sorting
  const [sortBy, setSortBy] = useState('dueDate')

  // The most recently deleted item, for the Undo message
  const [lastDeleted, setLastDeleted] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  }, [assignments])

  function handleAdd(event) {
    event.preventDefault()
    if (!title.trim()) return

    const error = validateDueDate(dueDate)
    if (error) {
      setAddError(error)
      return
    }

    const newAssignment = {
      id: crypto.randomUUID(),
      title: title.trim(),
      course: course.trim(),
      dueDate,
      priority,
      completed: false,
      deletedAt: null,
    }

    setAssignments([...assignments, newAssignment])
    setTitle('')
    setCourse('')
    setDueDate('')
    setPriority('Medium')
    setAddError('')
  }

  function toggleCompleted(id) {
    setAssignments(
      assignments.map((a) =>
        a.id === id ? { ...a, completed: !a.completed } : a
      )
    )
  }

  // Move to trash (not gone yet)
  function deleteAssignment(id) {
    const target = assignments.find((a) => a.id === id)
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, deletedAt: Date.now() } : a))
    )
    setLastDeleted({ id, title: target.title })
  }

  // Take it back out of the trash
  function restoreAssignment(id) {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, deletedAt: null } : a))
    )
    if (lastDeleted && lastDeleted.id === id) setLastDeleted(null)
  }

  function undoDelete() {
    restoreAssignment(lastDeleted.id)
    setLastDeleted(null)
  }

  // Gone for good
  function deleteForever(id) {
    setAssignments(assignments.filter((a) => a.id !== id))
  }

  function emptyTrash() {
    const sure = window.confirm(
      'Permanently delete everything in the trash? This cannot be undone.'
    )
    if (sure) setAssignments(assignments.filter((a) => !a.deletedAt))
  }

  function startEditing(assignment) {
    setEditingId(assignment.id)
    setEditDraft({ ...assignment })
    setEditError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditDraft(null)
    setEditError('')
  }

  function updateDraft(field, value) {
    setEditDraft({ ...editDraft, [field]: value })
    if (field === 'dueDate') setEditError('')
  }

  function saveEdit(event) {
    event.preventDefault()
    if (!editDraft.title.trim()) return

    const original = assignments.find((a) => a.id === editingId)
    const error =
      editDraft.dueDate !== original.dueDate ? validateDueDate(editDraft.dueDate) : ''
    if (error) {
      setEditError(error)
      return
    }

    setAssignments(
      assignments.map((a) =>
        a.id === editingId
          ? { ...editDraft, title: editDraft.title.trim(), course: editDraft.course.trim() }
          : a
      )
    )
    cancelEditing()
  }

  function renderAssignment(a) {
    if (editingId === a.id) {
      return (
        <li key={a.id} className="editing">
          <form onSubmit={saveEdit} className="assignment-form">
            <div className="field">
              <label htmlFor={`edit-title-${a.id}`}>Title (required)</label>
              <input
                id={`edit-title-${a.id}`}
                value={editDraft.title}
                onChange={(e) => updateDraft('title', e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor={`edit-course-${a.id}`}>Course</label>
              <input
                id={`edit-course-${a.id}`}
                value={editDraft.course}
                onChange={(e) => updateDraft('course', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor={`edit-date-${a.id}`}>Due date</label>
              <input
                id={`edit-date-${a.id}`}
                type="date"
                value={editDraft.dueDate}
                onChange={(e) => updateDraft('dueDate', e.target.value)}
                aria-invalid={editError ? 'true' : undefined}
                aria-describedby={editError ? `edit-date-error-${a.id}` : undefined}
              />
              {editError && (
                <p id={`edit-date-error-${a.id}`} className="error" role="alert">
                  {editError}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor={`edit-priority-${a.id}`}>Priority</label>
              <select
                id={`edit-priority-${a.id}`}
                value={editDraft.priority}
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

    return (
      <li key={a.id} className={a.completed ? 'done' : ''}>
        <div className="assignment-main">
          <input
            type="checkbox"
            id={`done-${a.id}`}
            checked={a.completed}
            onChange={() => toggleCompleted(a.id)}
          />
          <label htmlFor={`done-${a.id}`} className="assignment-title">
            {a.title}
          </label>
          {status && <span className={`badge ${status.className}`}>{status.label}</span>}
        </div>

        <p className="details">
          {a.course || 'No course'} · Due {formatDate(a.dueDate)} ·{' '}
          <span className={`priority priority-${a.priority.toLowerCase()}`}>
            {a.priority} priority
          </span>
        </p>

        <div className="actions">
          <button
            type="button"
            onClick={() => startEditing(a)}
            aria-label={`Edit ${a.title}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => deleteAssignment(a.id)}
            aria-label={`Delete ${a.title}`}
          >
            Delete
          </button>
        </div>
      </li>
    )
  }

  // Split the list: active vs. in the trash
  const activeAssignments = assignments.filter((a) => !a.deletedAt)
  const trashedAssignments = assignments.filter((a) => a.deletedAt)

  const sorted = sortAssignments(activeAssignments, sortBy)
  const currentAssignments = sorted.filter((a) => !isOld(a))
  const olderAssignments = sorted.filter((a) => isOld(a))

  return (
    <main className="app">
      <h1>My Student Planner</h1>

      <section aria-labelledby="add-heading" className="card">
        <h2 id="add-heading">Add an assignment</h2>

        <form onSubmit={handleAdd} className="assignment-form">
          <div className="field">
            <label htmlFor="title">Title (required)</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="course">Course</label>
            <input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. CSIS 3700"
            />
          </div>

          <div className="field">
            <label htmlFor="dueDate">Due date</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value)
                setAddError('')
              }}
              aria-invalid={addError ? 'true' : undefined}
              aria-describedby={addError ? 'dueDate-error' : undefined}
            />
            {addError && (
              <p id="dueDate-error" className="error" role="alert">
                {addError}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <button type="submit" className="primary">
            Add assignment
          </button>
        </form>
      </section>

      <section aria-labelledby="list-heading" className="card">
        <h2 id="list-heading">My assignments ({activeAssignments.length})</h2>

        {/* Screen readers announce anything that appears in here */}
        <div role="status" aria-live="polite">
          {lastDeleted && (
            <div className="undo-bar">
              <span>Moved “{lastDeleted.title}” to the trash.</span>
              <button type="button" onClick={undoDelete}>
                Undo
              </button>
              <button
                type="button"
                onClick={() => setLastDeleted(null)}
                aria-label="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {activeAssignments.length > 0 && (
          <div className="sort-bar">
            <label htmlFor="sortBy">Sort by</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dueDate">Due date (soonest first)</option>
              <option value="priority">Priority (high first)</option>
              <option value="course">Course (A to Z)</option>
              <option value="added">Order added</option>
            </select>
          </div>
        )}

        {activeAssignments.length === 0 ? (
          <p>No assignments yet. Add your first one above.</p>
        ) : (
          <>
            {currentAssignments.length === 0 ? (
              <p>Nothing due right now.</p>
            ) : (
              <ul className="assignment-list">
                {currentAssignments.map(renderAssignment)}
              </ul>
            )}

            {olderAssignments.length > 0 && (
              <details className="older">
                <summary>
                  Older assignments ({olderAssignments.length}), due more than{' '}
                  {DAYS_TO_KEEP_OVERDUE} days ago
                </summary>
                <ul className="assignment-list">
                  {olderAssignments.map(renderAssignment)}
                </ul>
              </details>
            )}
          </>
        )}
      </section>

      {trashedAssignments.length > 0 && (
        <section aria-label="Trash" className="card">
          <details className="trash">
            <summary>
              Trash ({trashedAssignments.length}): items are deleted forever after{' '}
              {TRASH_DAYS} days
            </summary>

            <ul className="assignment-list">
              {trashedAssignments.map((a) => {
                const days = daysLeftInTrash(a)
                return (
                  <li key={a.id}>
                    <p className="assignment-title trash-title">{a.title}</p>
                    <p className="trash-details">
                      {a.course || 'No course'} · Deleted forever in {days}{' '}
                      {days === 1 ? 'day' : 'days'}
                    </p>
                    <div className="actions">
                      <button
                        type="button"
                        onClick={() => restoreAssignment(a.id)}
                        aria-label={`Restore ${a.title}`}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteForever(a.id)}
                        aria-label={`Delete ${a.title} forever`}
                      >
                        Delete forever
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <button type="button" className="danger empty-trash" onClick={emptyTrash}>
              Empty trash
            </button>
          </details>
        </section>
      )}
    </main>
  )
}

export default App