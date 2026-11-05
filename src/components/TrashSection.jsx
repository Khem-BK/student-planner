import { TRASH_DAYS } from '../utils/dates'
import { daysLeftInTrash } from '../utils/assignments'

function TrashSection({ items, onRestore, onDeleteForever, onEmpty }) {
  if (items.length === 0) return null

  return (
    <section aria-label="Trash" className="card">
      <details className="trash">
        <summary>
          Trash ({items.length}): items are deleted forever after {TRASH_DAYS} days
        </summary>

        <ul className="assignment-list">
          {items.map((a) => {
            const days = daysLeftInTrash(a)
            return (
              <li key={a.id}>
                <p className="trash-title">{a.title}</p>
                <p className="trash-details">
                  {a.course || 'No course'} · Deleted forever in {days}{' '}
                  {days === 1 ? 'day' : 'days'}
                </p>
                <div className="actions">
                  <button
                    type="button"
                    onClick={() => onRestore(a.id)}
                    aria-label={`Restore ${a.title}`}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDeleteForever(a.id)}
                    aria-label={`Delete ${a.title} forever`}
                  >
                    Delete forever
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        <button type="button" className="danger empty-trash" onClick={onEmpty}>
          Empty trash
        </button>
      </details>
    </section>
  )
}

export default TrashSection