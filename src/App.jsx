import { useState, useEffect } from 'react'
import './App.css'
import AddAssignmentForm from './components/AddAssignmentForm'
import AssignmentItem from './components/AssignmentItem'
import ListControls from './components/ListControls'
import TrashSection from './components/TrashSection'
import { DAYS_TO_KEEP_OVERDUE } from './utils/dates'
import {
  loadAssignments,
  saveAssignments,
  sortAssignments,
  filterAssignments,
  getCourses,
  isOld,
} from './utils/assignments'

function App() {
  const [assignments, setAssignments] = useState(loadAssignments)
  const [sortBy, setSortBy] = useState('dueDate')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastDeleted, setLastDeleted] = useState(null)

  useEffect(() => {
    saveAssignments(assignments)
  }, [assignments])

  function addAssignment(fields) {
    const newAssignment = {
      id: crypto.randomUUID(),
      ...fields,
      completed: false,
      deletedAt: null,
    }
    setAssignments([...assignments, newAssignment])
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

  function clearFilters() {
    setCourseFilter('all')
    setStatusFilter('all')
  }

  // Work out what to show
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
    <main className="app">
      <h1>My Student Planner</h1>

      <AddAssignmentForm onAdd={addAssignment} />

      <section aria-labelledby="list-heading" className="card">
        <h2 id="list-heading">My assignments ({active.length})</h2>

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
          <p>No assignments yet. Add your first one above.</p>
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
    </main>
  )
}

export default App