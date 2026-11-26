// All the date helpers in one place

export const DAYS_TO_KEEP_OVERDUE = 7
export const MAX_DAYS_AHEAD = 730 // about 2 years
export const TRASH_DAYS = 7
export const DAY_MS = 24 * 60 * 60 * 1000 // one day in milliseconds

// Turn a Date into text like "2026-11-04"
export function toDateText(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayText() {
  return toDateText(new Date())
}

export function addDays(dateText, days) {
  const date = new Date(dateText + 'T00:00')
  date.setDate(date.getDate() + days)
  return toDateText(date)
}

// Turn "2026-11-10" into "Tue, Nov 10, 2026"
export function formatDate(dateText) {
  if (!dateText) return 'No due date'
  return new Date(dateText + 'T00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Returns an error message, or '' if the date is fine
export function validateDueDate(dateText) {
  if (!dateText) return ''
  const today = todayText()
  if (dateText < addDays(today, -DAYS_TO_KEEP_OVERDUE)) {
    return `That date is more than ${DAYS_TO_KEEP_OVERDUE} days in the past. Please check the year.`
  }
  if (dateText > addDays(today, MAX_DAYS_AHEAD)) {
    return 'That date is more than 2 years away. Please check the year.'
  }
  return ''
}
// The current time as text, like "14:05"
export function nowTimeText() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Turn "23:59" into "11:59 PM"
export function formatTime(timeText) {
  if (!timeText) return ''
  const [hours, minutes] = timeText.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// "Due Fri, Nov 27, 2026 at 11:59 PM", or "No due date"
export function formatDue(dateText, timeText) {
  if (!dateText) return 'No due date'
  return timeText
    ? `Due ${formatDate(dateText)} at ${formatTime(timeText)}`
    : `Due ${formatDate(dateText)}`
}