import { useState } from 'react'
import { validateDueDate } from '../utils/dates'

// The "Add an assignment" form. It sends the new assignment to App with onAdd.
function AddAssignmentForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return

    const dateError = validateDueDate(dueDate)
    if (dateError) {
      setError(dateError)
      return
    }

    onAdd({ title: title.trim(), course: course.trim(), dueDate, priority })

    setTitle('')
    setCourse('')
    setDueDate('')
    setPriority('Medium')
    setError('')
  }

  return (
    <section aria-labelledby="add-heading" className="card">
      <h2 id="add-heading">Add an assignment</h2>

      <form onSubmit={handleSubmit} className="assignment-form">
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
              setError('')
            }}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'dueDate-error' : undefined}
          />
          {error && (
            <p id="dueDate-error" className="error" role="alert">
              {error}
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
  )
}

export default AddAssignmentForm