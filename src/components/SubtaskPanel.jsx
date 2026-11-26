import { useState, useRef, useEffect } from 'react'
import { suggestSubtasks } from '../utils/aiClient'

const MAX_STEPS = 10
const MAX_DETAILS = 8000

// Optional checklist of smaller steps under one assignment.
// The student can paste the real instructions so the AI's steps match them.
// Nothing is saved until Save steps.
function SubtaskPanel({ assignment, onSave }) {
  const subtasks = assignment.subtasks || []
  const [mode, setMode] = useState('view') // 'view', 'prep', 'loading', or 'edit'
  const [details, setDetails] = useState('')
  const [drafts, setDrafts] = useState([])
  const [fromAi, setFromAi] = useState(false)
  const [focusId, setFocusId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [aiReason, setAiReason] = useState('')
  const headingRef = useRef(null)
  const buttonRef = useRef(null)
  const returnFocusRef = useRef(false)

  const title = assignment.title
  const doneCount = subtasks.filter((s) => s.done).length

  useEffect(() => {
    if (mode === 'edit' && !focusId) headingRef.current?.focus()
  }, [mode, focusId])

  useEffect(() => {
    if (mode === 'view' && returnFocusRef.current) {
      buttonRef.current?.focus()
      returnFocusRef.current = false
    }
  }, [mode, subtasks.length])

  function startPrep() {
    setError('')
    setNotice('')
    setMode('prep')
  }

  async function askAi() {
    setError('')
    setNotice('')
    setMode('loading')
    try {
      const { steps, reason } = await suggestSubtasks(assignment, details.trim())
      if (steps.length === 0) {
        setNotice(reason || 'This looks simple enough to do in one sitting, so no steps are needed.')
        setMode('view')
        return
      }
      setAiReason(reason)
      setDrafts(steps.map((step) => ({ id: crypto.randomUUID(), title: step })))
      setFromAi(true)
      setFocusId(null)
      setMode('edit')
    } catch (err) {
      setError(err.message)
      setMode('view')
    }
  }

  function startEditing() {
    setDrafts(subtasks.map((s) => ({ id: s.id, title: s.title })))
    setFromAi(false)
    setFocusId(null)
    setError('')
    setNotice('')
    setMode('edit')
  }

  function updateDraft(id, value) {
    setDrafts(drafts.map((d) => (d.id === id ? { ...d, title: value } : d)))
  }

  function removeDraft(id) {
    setDrafts(drafts.filter((d) => d.id !== id))
  }

  function addDraft() {
    if (drafts.length >= MAX_STEPS) return
    const id = crypto.randomUUID()
    setDrafts([...drafts, { id, title: '' }])
    setFocusId(id)
  }

  function save() {
    const saved = drafts
      .map((d) => ({ ...d, title: d.title.trim() }))
      .filter((d) => d.title)
      .map((d) => {
        const old = subtasks.find((s) => s.id === d.id)
        return { id: d.id, title: d.title, done: old ? old.done : false }
      })
    onSave({ ...assignment, subtasks: saved })
    setDetails('')
    returnFocusRef.current = true
    setMode('view')
  }

  function cancel() {
    returnFocusRef.current = true
    setMode('view')
  }

  function toggleStep(id) {
    onSave({
      ...assignment,
      subtasks: subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    })
  }

  function clearSteps() {
    const sure = window.confirm(`Remove all steps from “${title}”?`)
    if (!sure) return
    returnFocusRef.current = true
    onSave({ ...assignment, subtasks: [] })
  }

  // ----- Before asking the AI: optional instructions -----
  if (mode === 'prep') {
    return (
      <div className="subtasks subtask-editor">
        <div className="field">
          <label htmlFor={`details-${assignment.id}`}>Assignment instructions (optional)</label>
          <textarea
            id={`details-${assignment.id}`}
            rows="5"
            maxLength={MAX_DETAILS}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            aria-describedby={`details-hint-${assignment.id}`}
            autoFocus
          />
          <p id={`details-hint-${assignment.id}`} className="hint">
            For better steps, copy the instructions from Blackboard (and any feedback) and paste
            them here. You can also leave this empty.
          </p>
        </div>
        <div className="actions">
          <button type="button" className="primary small" onClick={askAi}>
            Suggest steps
          </button>
          <button type="button" className="small" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ----- Editing -----
  if (mode === 'edit') {
    return (
      <div className="subtasks subtask-editor">
        <h4 tabIndex="-1" ref={headingRef}>
          {fromAi ? `Check the suggested steps for “${title}”` : `Edit steps for “${title}”`}
        </h4>
        {fromAi && (
          <p className="ai-note">
            AI suggestions can be wrong or miss something. Edit, remove, or add steps. Nothing is
            saved until you click Save steps.
          </p>
        )}
        {fromAi && aiReason && <p className="hint">AI note: {aiReason}</p>}
        {drafts.length === 0 && <p className="hint">No steps yet. Add one below.</p>}

        <ol className="subtask-edit-list">
          {drafts.map((d, index) => (
            <li key={d.id}>
              <div className="subtask-edit-row">
                <label htmlFor={`draft-${d.id}`} className="sr-only">
                  Step {index + 1}
                </label>
                <input
                  id={`draft-${d.id}`}
                  value={d.title}
                  onChange={(e) => updateDraft(d.id, e.target.value)}
                  autoFocus={d.id === focusId}
                />
                <button
                  type="button"
                  className="small"
                  onClick={() => removeDraft(d.id)}
                  aria-label={`Remove step ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div className="actions">
          <button
            type="button"
            className="small"
            onClick={addDraft}
            disabled={drafts.length >= MAX_STEPS}
          >
            Add a step
          </button>
          <button type="button" className="small" onClick={startPrep}>
            {fromAi ? 'Ask AI again' : 'Suggest steps with AI'}
          </button>
        </div>

        <div className="actions">
          <button type="button" className="primary small" onClick={save}>
            Save steps
          </button>
          <button type="button" className="small" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ----- Normal view -----
  return (
    <div className="subtasks">
      {subtasks.length > 0 && (
        <>
          <p className="subtask-progress" id={`progress-${assignment.id}`}>
            {doneCount} of {subtasks.length} steps done
          </p>
          <ul className="subtask-list" aria-labelledby={`progress-${assignment.id}`}>
            {subtasks.map((s) => (
              <li key={s.id} className={s.done ? 'subtask-done' : ''}>
                <input
                  type="checkbox"
                  id={`step-${s.id}`}
                  checked={s.done}
                  onChange={() => toggleStep(s.id)}
                />
                <label htmlFor={`step-${s.id}`}>{s.title}</label>
              </li>
            ))}
          </ul>
        </>
      )}

      <div role="status" aria-live="polite">
        {mode === 'loading' && <p className="hint">Asking the AI for steps…</p>}
        {notice && <p className="hint">{notice}</p>}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="subtask-links">
        {subtasks.length === 0 ? (
          <>
            <button
              ref={buttonRef}
              type="button"
              className="link-button"
              onClick={startPrep}
              disabled={mode === 'loading'}
              aria-label={`Break into steps: ${title}`}
            >
              {mode === 'loading' ? 'Thinking…' : 'Break into steps'}
            </button>
            {(notice || error) && (
              <button type="button" className="link-button" onClick={startEditing}>
                Add my own steps
              </button>
            )}
          </>
        ) : (
          <>
            <button
              ref={buttonRef}
              type="button"
              className="link-button"
              onClick={startEditing}
              aria-label={`Edit steps: ${title}`}
            >
              Edit steps
            </button>
            <button
              type="button"
              className="link-button"
              onClick={clearSteps}
              aria-label={`Remove steps: ${title}`}
            >
              Remove steps
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SubtaskPanel