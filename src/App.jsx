import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'student-planner-assignments'

// Read saved assignments from the browser when the app starts
function loadAssignments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Turn "2026-11-10" into "Tue, Nov 10, 2026"
function formatDate(dateText) {
  if (!dateText) return 'No due date'
  return new Date(dateText + 'T00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function App() {
  // The list of all assignments
  const [assignments, setAssignments] = useState(loadAssignments)

  // What the user is typing in the form
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')

  // Every time the list changes, save it in the browser
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  }, [assignments])

  function handleAdd(event) {
    event.preventDefault() // stop the page from reloading
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

    // Clear the form
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

        {assignments.length === 0 ? (
          <p>No assignments yet. Add your first one above.</p>
        ) : (
          <ul className="assignment-list">
            {assignments.map((a) => (
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

                <button
                  type="button"
                  onClick={() => deleteAssignment(a.id)}
                  aria-label={`Delete ${a.title}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App