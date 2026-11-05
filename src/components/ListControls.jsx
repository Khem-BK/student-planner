// The Sort, Course, and Status menus above the list
function ListControls({
  sortBy,
  onSortChange,
  courseFilter,
  onCourseChange,
  statusFilter,
  onStatusChange,
  courses,
  shownCount,
  totalCount,
  onClear,
}) {
  const filtersOn = courseFilter !== 'all' || statusFilter !== 'all'

  return (
    <>
      <div className="controls">
        <div className="field">
          <label htmlFor="sortBy">Sort by</label>
          <select id="sortBy" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            <option value="dueDate">Due date (soonest first)</option>
            <option value="priority">Priority (high first)</option>
            <option value="course">Course (A to Z)</option>
            <option value="added">Order added</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="courseFilter">Course</label>
          <select
            id="courseFilter"
            value={courseFilter}
            onChange={(e) => onCourseChange(e.target.value)}
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="statusFilter">Status</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">All</option>
            <option value="todo">To do</option>
            <option value="done">Done</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="results-row">
        {/* Screen readers hear the new count when filters change */}
        <p className="results" aria-live="polite">
          Showing {shownCount} of {totalCount}
        </p>
        {filtersOn && (
          <button type="button" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </>
  )
}

export default ListControls