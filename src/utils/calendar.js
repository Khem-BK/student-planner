// Builds a calendar file (.ics) that Apple Calendar, Google Calendar, and Outlook can import

import { addDays, todayText, nowTimeText, formatTime } from './dates'

// Reminder choices.
// "allDay" is used for assignments without a time (counted from midnight at the start of the day).
// "timed" is used for assignments with a time (counted from the due time).
export const REMINDERS = [
  { value: 'day-before', label: '1 day before', allDay: '-PT15H', timed: '-P1D' },
  { value: 'two-days', label: '2 days before', allDay: '-P1DT15H', timed: '-P2D' },
  { value: 'hour-before', label: '1 hour before', allDay: 'PT8H', timed: '-PT1H' },
  { value: 'at-time', label: 'At the due time', allDay: 'PT8H', timed: 'PT0M' },
  { value: 'none', label: 'No reminder', allDay: null, timed: null },
]

// Calendar files treat \ ; , and new lines as special, so they must be "escaped"
function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// The format says lines should be short. Long lines continue on the next line after a space.
function fold(line) {
  const parts = []
  let rest = line
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74))
    rest = rest.slice(74)
  }
  parts.push(rest)
  return parts.join('\r\n ')
}

// "2026-12-04" -> "20261204"
function compactDate(dateText) {
  return dateText.replaceAll('-', '')
}

// "23:59" -> "235900"
function compactTime(timeText) {
  return timeText.replace(':', '') + '00'
}

// The current time in calendar format, like 20261126T180000Z
function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Only unfinished assignments that are not past due yet
export function upcomingForCalendar(assignments) {
  const today = todayText()
  const now = nowTimeText()
  return assignments.filter((a) => {
    if (a.completed || !a.dueDate) return false
    if (a.dueDate > today) return true
    return a.dueDate === today && (!a.dueTime || a.dueTime > now)
  })
}

export function buildCalendar(assignments, reminderValue) {
  const reminder = REMINDERS.find((r) => r.value === reminderValue) || REMINDERS[0]
  const stamp = timestamp()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Student Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const a of assignments) {
    const steps = (a.subtasks || []).map(
      (s, i) => `${i + 1}. ${s.title}${s.done ? ' (done)' : ''}`
    )
    const description = [
      a.dueTime ? `Due at ${formatTime(a.dueTime)}` : '',
      `Priority: ${a.priority}`,
      a.course ? `Course: ${a.course}` : '',
      ...(steps.length > 0 ? ['Steps:', ...steps] : []),
    ]
      .filter(Boolean)
      .join('\n')

    lines.push('BEGIN:VEVENT', `UID:${a.id}@student-planner`, `DTSTAMP:${stamp}`)

    if (a.dueTime) {
      // Timed event: a 15 minute block that starts at the due time (in your local time)
      lines.push(
        `DTSTART:${compactDate(a.dueDate)}T${compactTime(a.dueTime)}`,
        'DURATION:PT15M'
      )
    } else {
      // All day event
      lines.push(
        `DTSTART;VALUE=DATE:${compactDate(a.dueDate)}`,
        `DTEND;VALUE=DATE:${compactDate(addDays(a.dueDate, 1))}`
      )
    }

    lines.push(
      'TRANSP:TRANSPARENT', // does not block your schedule
      `SUMMARY:${escapeText(`Due: ${a.title}${a.course ? ` (${a.course})` : ''}`)}`,
      `DESCRIPTION:${escapeText(description)}`
    )

    const trigger = a.dueTime ? reminder.timed : reminder.allDay
    if (trigger) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(`${a.title} is due`)}`,
        `TRIGGER:${trigger}`,
        'END:VALARM'
      )
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  // The format uses \r\n (Windows style) line endings
  return lines.map(fold).join('\r\n') + '\r\n'
}

// Turn the text into a file and make the browser download it
export function downloadCalendar(text, fileName = 'student-planner.ics') {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}