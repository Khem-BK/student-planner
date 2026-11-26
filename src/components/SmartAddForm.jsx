import { useState, useRef, useEffect } from 'react'
import { extractAssignments } from '../utils/aiClient'
import { validateDueDate } from '../utils/dates'

const MAX_LENGTH = 15000

// Returns a problem message for one suggestion, or '' if it is fine
function checkItem(item) {
  if (!item.title.trim()) return 'Add a title.'
  return validateDueDate(item.dueDate)
}

// Paste a syllabus, announcement, or email. The AI finds the assignments.
// Nothing is saved until the user reviews the list and clicks Save.
function SmartAddForm({ onAddMany }) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // 'idle', 'loading', or 'review'
  const [items, setItems] = useState([])
  const [problems, setProblems] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const reviewHeadingRef = useRef(null)

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
      const found = await extractAssignments(text.trim())
      if (found.length === 0) {
        setError('The AI did not find any assignments in that text. Try adding more detail, or add it by hand.')
        setStatus('idle')
        return
      }

      // Items with a problem start unticked, so nothing wrong is saved by accident
      const newProblems = {}
      const prepared = found.map((item) => {
        const problem = checkItem(item)
        if (problem) newProblems[item.key] = problem
        return { ...item, include: !problem }
      })

      setItems(prepared)
      setProblems(newProblems)
      setStatus('review')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  function updateItem(key, field, value) {
    setItems(items.map((item) => (item.key === key ? { ...item, [field]: value } : item)))
    if (field !== 'include' && problems[key]) {
      const next = { ...problems }
      delete next[key]
      setProblems(next)
    }
  }

  function setAll(include) {
    setItems(items.map((item) => ({ ...item, include })))
  }

  function handleSave(event) {
    event.preventDefault()
    const chosen = items.filter((item) => item.include)

    if (chosen.length === 0) {
      setError('Tick at least one assignment to save, or click Cancel.')
      return
    }

    const newProblems = {}
    chosen.forEach((item) => {
      const problem = checkItem(item)
      if (problem) newProblems[item.key] = problem
    })
    if (Object.keys(newProblems).length > 0) {
      setProblems(newProblems)
      setError('Some ticked assignments need fixing. Fix them or untick them.')
      return
    }

    onAddMany(
      chosen.map((item) => ({
        title: item.title.trim(),
        course: item.course.trim(),
        dueDate: item.dueDate,
        priority: item.priority,
      }))
    )

    setMessage(`Added ${chosen.length} ${chosen.length === 1 ? 'assignment' : 'assignments'}.`)
    setText('')
    setItems([])
    setProblems({})
    setError('')
    setStatus('idle')
  }

  function handleCancel() {
    setItems([])
    setProblems({})
    setError('')
    setStatus('idle')
  }

  const selectedCount = items.filter((item) => item.include).length

  return (
    <section aria-labelledby="ai-add-heading" className="card ai-card">
      <h2 id="ai-add-heading">Quick add with AI</h2>

      {status !== 'review' && (
        <form onSubmit={handleAsk} className="assignment-form">
          <div className="field">
            <label htmlFor="ai-text">Paste or describe your assignments</label>
            <textarea
              id="ai-text"
              rows="5"
              maxLength={MAX_LENGTH}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a syllabus schedule, a Blackboard announcement, or an email. Or type one: Stats homework 12 due Friday, high priority"
              aria-describedby="ai-hint"
            />
            <p id="ai-hint" className="hint">
              The AI finds the assignments. You check every one before anything is saved.
            </p>
          </div>

          <button
            type="submit"
            className="primary"
            disabled={status === 'loading' || !text.trim()}
          >
            {status === 'loading' ? 'Reading…' : 'Find assignments with AI'}
          </button>
        </form>
      )}

      <div role="status" aria-live="polite">
        {status === 'loading' && (
          <p className="hint">Reading your text. Long syllabi can take up to 30 seconds.</p>
        )}
        {message && <p className="success">{message}</p>}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {status === 'review' && (
        <form onSubmit={handleSave} className="review-box">
          <div className="review-header">
            <h3 tabIndex="-1" ref={reviewHeadingRef}>
              Check the AI's suggestions ({items.length} found)
            </h3>
            <div className="review-toolbar">
              <span className="hint">
                {selectedCount} of {items.length} selected
              </span>
              <button type="button" className="small" onClick={() => setAll(true)}>
                Select all
              </button>
              <button type="button" className="small" onClick={() => setAll(false)}>
                Select none
              </button>
            </div>
          </div>

          <p className="ai-note">
            AI can make mistakes. Fix anything that looks wrong and untick anything you don't
            want. Nothing is saved until you click Save.
          </p>

          <ul className="review-list">
            {items.map((item, index) => {
              const problem = problems[item.key]
              const problemId = `ai-problem-${item.key}`
              return (
                <li key={item.key} className={item.include ? 'review-item' : 'review-item excluded'}>
                  <fieldset aria-describedby={problem ? problemId : undefined}>
                    <legend className="review-legend">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={item.include}
                          onChange={(e) => updateItem(item.key, 'include', e.target.checked)}
                        />
                        Include assignment {index + 1} of {items.length}
                      </label>
                      {!item.include && <span className="tag-muted">Not included</span>}
                    </legend>

                    <div className="review-fields">
                      <div className="field">
                        <label htmlFor={`ai-title-${item.key}`}>Title</label>
                        <input
                          id={`ai-title-${item.key}`}
                          value={item.title}
                          onChange={(e) => updateItem(item.key, 'title', e.target.value)}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`ai-course-${item.key}`}>Course</label>
                        <input
                          id={`ai-course-${item.key}`}
                          value={item.course}
                          onChange={(e) => updateItem(item.key, 'course', e.target.value)}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`ai-date-${item.key}`}>Due date</label>
                        <input
                          id={`ai-date-${item.key}`}
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => updateItem(item.key, 'dueDate', e.target.value)}
                          aria-invalid={problem ? 'true' : undefined}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`ai-priority-${item.key}`}>Priority</label>
                        <select
                          id={`ai-priority-${item.key}`}
                          value={item.priority}
                          onChange={(e) => updateItem(item.key, 'priority', e.target.value)}
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                    </div>

                    {(problem || item.notes) && (
                      <div className="review-messages">
                        {problem && (
                          <p id={problemId} className="error">
                            {problem}
                          </p>
                        )}
                        {item.notes && <p className="hint">AI note: {item.notes}</p>}
                      </div>
                    )}
                  </fieldset>
                </li>
              )
            })}
          </ul>

          <div className="actions">
            <button type="submit" className="primary">
              Save {selectedCount} selected
            </button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default SmartAddForm