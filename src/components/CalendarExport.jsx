import { useState } from 'react'
import {
  REMINDERS,
  upcomingForCalendar,
  buildCalendar,
  downloadCalendar,
} from '../utils/calendar'

// "Add to calendar" button: downloads a .ics file of the assignments shown
function CalendarExport({ assignments }) {
  const [reminder, setReminder] = useState('day-before')
  const [message, setMessage] = useState('')
  const items = upcomingForCalendar(assignments)

  function handleExport() {
    if (items.length === 0) return
    downloadCalendar(buildCalendar(items, reminder))
    setMessage(
      `Downloaded a calendar file with ${items.length} ${
        items.length === 1 ? 'assignment' : 'assignments'
      }. Open it to add them to your calendar.`
    )
  }

  return (
    <div className="calendar-export">
      <div className="calendar-row">
        <div className="field">
          <label htmlFor="calendar-reminder">Calendar reminder</label>
          <select
            id="calendar-reminder"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
          >
            {REMINDERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={items.length === 0}
          aria-describedby="calendar-hint"
        >
          Add to calendar ({items.length})
        </button>
      </div>

      <p id="calendar-hint" className="hint">
        Exports the upcoming, unfinished assignments shown below. Use the filters to export one
        course.
      </p>

      <p role="status" className="success">
        {message}
      </p>
    </div>
  )
}

export default CalendarExport