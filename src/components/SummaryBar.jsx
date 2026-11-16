import { isOverdue } from '../utils/assignments'
import { todayText } from '../utils/dates'

// Count boxes at the top. Clicking one filters the list.
function SummaryBar({ assignments, activeStatus, onSelect }) {
  const today = todayText()
  const todo = assignments.filter((a) => !a.completed).length
  const dueToday = assignments.filter((a) => !a.completed && a.dueDate === today).length
  const overdue = assignments.filter((a) => isOverdue(a)).length
  const done = assignments.filter((a) => a.completed).length

  const items = [
    { status: 'todo', label: 'To do', value: todo },
    { status: 'today', label: 'Due today', value: dueToday },
    { status: 'overdue', label: 'Overdue', value: overdue, warn: overdue > 0 },
    { status: 'done', label: 'Done', value: done },
  ]

  return (
    <section aria-label="Summary" className="summary">
      <ul className="summary-list">
        {items.map((item) => (
          <li key={item.status}>
            <button
              type="button"
              className={item.warn ? 'summary-item summary-warn' : 'summary-item'}
              aria-pressed={activeStatus === item.status}
              onClick={() => onSelect(item.status)}
            >
              <span className="summary-value">{item.value}</span>
              <span className="summary-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default SummaryBar