import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'student-planner-assignments'
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

function loadAssignments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
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

// Make a sorted COPY of the list (the original order stays saved)
function sortAssignments(list, sortBy) {
  const copy = [...list]
  if (sortBy === 'dueDate') {
    copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1 // no date goes to the bottom
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

  // Editing: which card is open, and its unsaved changes
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  // Sorting
  const [sortBy, setSortBy] = useState('dueDate')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  }, [assignments])

  function handleAdd(event) {
    event.preventDefault()
    if (!title.trim()) return

    const newAssignment = {
      id: crypto.randomUUID(),
      title: title.trim(),
      course: course.trim(),
      dueDate,
      priority,
      completed: false,
    }

    setAssignments([...assignments, newAssignment])
    setTitle('')
    setCourse('')
    setDueDate('')
    setPriority('Medium')
  }

  function toggleCompleted(id) {
    setAssignments(
      assignments.map((a) =>
        a.id === id ? { ...a, completed: !a.completed } : a
      )
    )
  }

  function deleteAssignment(id) {
    setAssignments(assignments.filter((a) => a.id !== id))
  }

  function startEditing(assignment) {
    setEditingId(assignment.id)
    setEditDraft({ ...assignment }) // work on a copy until Save
  }

  function cancelEditing() {
    setEditingId(null)
    setEditDraft(null)
  }

  function updateDraft(field, value) {
    setEditDraft({ ...editDraft, [field]: value })
  }

  function saveEdit(event) {
    event.preventDefault()
    if (!editDraft.title.trim()) return

    setAssignments(
      assignments.map((a) =>
        a.id === editingId
          ? { ...editDraft, title: editDraft.title.trim(), course: editDraft.course.trim() }
          : a
      )
    )
    cancelEditing()
  }

  const shownAssignments = sortAssignments(assignments, sortBy)

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
              onChange={(e) => setDueDate(e.target.value)}
            />
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
        <h2 id="list-heading">My assignments ({assignments.length})</h2>

        {assignments.length > 0 && (
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

        {assignments.length === 0 ? (
          <p>No assignments yet. Add your first one above.</p>
        ) : (
          <ul className="assignment-list">
            {shownAssignments.map((a) =>
              editingId === a.id ? (
                // EDIT MODE for this card
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
                      />
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
              ) : (
                // NORMAL VIEW for this card
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
            )}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App