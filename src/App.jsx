import { useState, useEffect, useRef } from 'react'
import './App.css'
import AddAssignmentForm from './components/AddAssignmentForm'
import AssignmentItem from './components/AssignmentItem'
import ListControls from './components/ListControls'
import TrashSection from './components/TrashSection'
import AccessibilityPanel from './components/AccessibilityPanel'
import SummaryBar from './components/SummaryBar'
import SmartAddForm from './components/SmartAddForm'
import { DAYS_TO_KEEP_OVERDUE, formatDate, todayText } from './utils/dates'
import {
  loadAssignments,
  saveAssignments,
  sortAssignments,
  filterAssignments,
  getCourses,
  isOld,
} from './utils/assignments'
import {
  loadPreferences,
  savePreferences,
  applyPreferences,
  defaultPreferences,
} from './utils/preferences'

function App() {
  const [assignments, setAssignments] = useState(loadAssignments)
  const [sortBy, setSortBy] = useState('dueDate')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastDeleted, setLastDeleted] = useState(null)

  const [prefs, setPrefs] = useState(loadPreferences)
  const [panelOpen, setPanelOpen] = useState(false)
  const settingsButtonRef = useRef(null)

  useEffect(() => {
    saveAssignments(assignments)
  }, [assignments])

  useEffect(() => {
    savePreferences(prefs)
    applyPreferences(prefs)
  }, [prefs])

  function closePanel() {
    setPanelOpen(false)
    settingsButtonRef.current?.focus()
  }

  // Keyboard shortcuts: Option (Alt) + N, L, or A
  useEffect(() => {
    if (!prefs.shortcuts) return

    function handleShortcut(event) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return

      if (event.code === 'KeyN') {
        event.preventDefault()
        document.getElementById('title')?.focus()
      } else if (event.code === 'KeyL') {
        event.preventDefault()
        document.getElementById('list-heading')?.focus()
      } else if (event.code === 'KeyA') {
        event.preventDefault()
        if (panelOpen) {
          setPanelOpen(false)
          settingsButtonRef.current?.focus()
        } else {
          setPanelOpen(true)
        }
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [prefs.shortcuts, panelOpen])

  function addAssignment(fields) {
    const newAssignment = {
      id: crypto.randomUUID(),
      ...fields,
      completed: false,
      deletedAt: null,
    }
    setAssignments([...assignments, newAssignment])
  }
    // Add several assignments at once (from the AI review list)
  function addManyAssignments(list) {
    const newOnes = list.map((fields) => ({
      id: crypto.randomUUID(),
      ...fields,
      completed: false,
      deletedAt: null,
    }))
    setAssignments([...assignments, ...newOnes])
  }

  function updateAssignment(updated) {
    setAssignments(assignments.map((a) => (a.id === updated.id ? updated : a)))
  }

  function toggleCompleted(id) {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    )
  }

  function deleteAssignment(id) {
    const target = assignments.find((a) => a.id === id)
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, deletedAt: Date.now() } : a))
    )
    setLastDeleted({ id, title: target.title })
  }

  function restoreAssignment(id) {
    setAssignments(assignments.map((a) => (a.id === id ? { ...a, deletedAt: null } : a)))
    if (lastDeleted && lastDeleted.id === id) setLastDeleted(null)
  }

  function undoDelete() {
    restoreAssignment(lastDeleted.id)
    setLastDeleted(null)
  }

  function deleteForever(id) {
    setAssignments(assignments.filter((a) => a.id !== id))
  }

  function emptyTrash() {
    const sure = window.confirm(
      'Permanently delete everything in the trash? This cannot be undone.'
    )
    if (sure) setAssignments(assignments.filter((a) => !a.deletedAt))
  }
  // Clicking a summary box filters the list and jumps to it
  function handleSummaryClick(status) {
    setStatusFilter(statusFilter === status ? 'all' : status)
    document.getElementById('list-heading')?.focus()
  }

  function clearFilters() {
    setCourseFilter('all')
    setStatusFilter('all')
  }

  const active = assignments.filter((a) => !a.deletedAt)
  const trashed = assignments.filter((a) => a.deletedAt)
  const courses = getCourses(active)
  const shown = sortAssignments(filterAssignments(active, courseFilter, statusFilter), sortBy)
  const current = shown.filter((a) => !isOld(a))
  const older = shown.filter((a) => isOld(a))

  function renderList(list) {
    return (
      <ul className="assignment-list">
        {list.map((a) => (
          <AssignmentItem
            key={a.id}
            assignment={a}
            onToggle={toggleCompleted}
            onSave={updateAssignment}
            onDelete={deleteAssignment}
          />
        ))}
      </ul>
    )
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header">
        <div>
          <h1>My Student Planner</h1>
          <p className="today">{formatDate(todayText())}</p>
        </div>
        <button
          ref={settingsButtonRef}
          type="button"
          className="settings-button"
          aria-expanded={panelOpen}
          aria-controls="a11y-panel"
          onClick={() => (panelOpen ? closePanel() : setPanelOpen(true))}
        >
          Accessibility settings
        </button>
      </header>

      <main id="main-content" className="app" tabIndex="-1">
        {panelOpen && (
          <AccessibilityPanel
            prefs={prefs}
            onChange={setPrefs}
            onReset={() => setPrefs(defaultPreferences())}
            onClose={closePanel}
          />
        )}

               <SummaryBar
          assignments={active}
          activeStatus={statusFilter}
          onSelect={handleSummaryClick}
        />

        <div className="layout">
          {/* Left column on laptops: the add form */}
          <div className="layout-side">
            <SmartAddForm onAddMany={addManyAssignments} />
            <AddAssignmentForm onAdd={addAssignment} />
          </div>

          {/* Right column on laptops: the list and trash */}
          <div className="layout-main">
            <section aria-labelledby="list-heading" className="card">
              <h2 id="list-heading" tabIndex="-1">
                My assignments ({active.length})
              </h2>

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

              {active.length === 0 ? (
                <p>No assignments yet. Add your first one.</p>
              ) : (
                <>
                  <ListControls
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    courseFilter={courseFilter}
                    onCourseChange={setCourseFilter}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    courses={courses}
                    shownCount={shown.length}
                    totalCount={active.length}
                    onClear={clearFilters}
                  />

                  {shown.length === 0 && <p>No assignments match these filters.</p>}
                  {shown.length > 0 && current.length === 0 && <p>Nothing due right now.</p>}
                  {current.length > 0 && renderList(current)}

                  {older.length > 0 && (
                    <details className="older">
                      <summary>
                        Older assignments ({older.length}), due more than{' '}
                        {DAYS_TO_KEEP_OVERDUE} days ago
                      </summary>
                      {renderList(older)}
                    </details>
                  )}
                </>
              )}
            </section>

            <TrashSection
              items={trashed}
              onRestore={restoreAssignment}
              onDeleteForever={deleteForever}
              onEmpty={emptyTrash}
            />
          </div>
        </div>
      </main>
    </>
  )
}

export default App