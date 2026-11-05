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