import { useState, useRef, useEffect } from 'react'
import { parseAssignment } from '../utils/aiClient'
import { validateDueDate } from '../utils/dates'

// "Describe it and let AI fill in the form." Nothing is saved until the user clicks Save.
function SmartAddForm({ onAdd }) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // 'idle', 'loading', or 'review'
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const [dateError, setDateError] = useState('')
  const [message, setMessage] = useState('')
  const reviewHeadingRef = useRef(null)

  // When the review box appears, move focus to it
  useEffect(() => {
    if (status === 'review') reviewHeadingRef.current?.focus()
  }, [status])

  async function handleAsk(event) {
    event.preventDefault()
    if (!text.trim()) return
    setError('')
    setMessage('')
    setStatus('loading')
    try {
      const suggestion = await parseAssignment(text.trim())
      setDraft(suggestion)
      setDateError(validateDueDate(suggestion.dueDate))
      setStatus('review')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  function updateDraft(field, value) {
    setDraft({ ...draft, [field]: value })
    if (field === 'dueDate') setDateError('')
  }

  function handleSave(event) {
    event.preventDefault()
    if (!draft.title.trim()) return

    const problem = validateDueDate(draft.dueDate)
    if (problem) {
      setDateError(problem)
      return
    }

    onAdd({
      title: draft.title.trim(),
      course: draft.course.trim(),
      dueDate: draft.dueDate,
      priority: draft.priority,
    })
    setMessage(`Added “${draft.title.trim()}”.`)
    setText('')
    setDraft(null)
    setStatus('idle')
  }

  function handleCancel() {
    setDraft(null)
    setStatus('idle') // keep the text so the user can change it and try again
  }

  return (
    <section aria-labelledby="ai-add-heading" className="card ai-card">
      <h2 id="ai-add-heading">Quick add with AI</h2>

      {status !== 'review' && (
        <form onSubmit={handleAsk} className="assignment-form">
          <div className="field">
            <label htmlFor="ai-text">Describe your assignment</label>
            <textarea
              id="ai-text"
              rows="3"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Stats homework 7 for STAT 3743 due Friday, high priority"
              aria-describedby="ai-hint"
            />
            <p id="ai-hint" className="hint">
              The AI fills in the details. You check them before anything is saved.
            </p>
          </div>

          <button
            type="submit"
            className="primary"
            disabled={status === 'loading' || !text.trim()}
          >
            {status === 'loading' ? 'Working on it…' : 'Fill in with AI'}
          </button>
        </form>
      )}

      {/* Screen readers hear these updates */}
      <div role="status" aria-live="polite">
        {status === 'loading' && <p className="hint">Asking the AI. This takes a few seconds.</p>}
        {message && <p className="success">{message}</p>}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {status === 'review' && draft && (
        <form onSubmit={handleSave} className="assignment-form review-box">
          <h3 tabIndex="-1" ref={reviewHeadingRef}>
            Check the AI's suggestion
          </h3>
          <p className="ai-note">
            AI can make mistakes. Fix anything that looks wrong. Nothing is saved until you click Save.
          </p>
          {draft.notes && <p className="hint">AI note: {draft.notes}</p>}

          <div className="field">
            <label htmlFor="ai-title">Title (required)</label>
            <input
              id="ai-title"
              value={draft.title}
              onChange={(e) => updateDraft('title', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="ai-course">Course</label>
            <input
              id="ai-course"
              value={draft.course}
              onChange={(e) => updateDraft('course', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="ai-date">Due date</label>
            <input
              id="ai-date"
              type="date"
              value={draft.dueDate}
              onChange={(e) => updateDraft('dueDate', e.target.value)}
              aria-invalid={dateError ? 'true' : undefined}
              aria-describedby={dateError ? 'ai-date-error' : undefined}
            />
            {dateError && (
              <p id="ai-date-error" className="error" role="alert">
                {dateError}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="ai-priority">Priority</label>
            <select
              id="ai-priority"
              value={draft.priority}
              onChange={(e) => updateDraft('priority', e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="actions">
            <button type="submit" className="primary">Save assignment</button>
            <button type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}

export default SmartAddForm