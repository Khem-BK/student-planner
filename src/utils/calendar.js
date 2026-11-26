// Builds a calendar file (.ics) that Apple Calendar, Google Calendar, and Outlook can import

import { addDays, todayText } from './dates'

// Reminder choices. TRIGGER times count from midnight at the start of the due date.
export const REMINDERS = [
  { value: 'day-before', label: '9 AM the day before', trigger: '-PT15H' },
  { value: 'two-days', label: '9 AM two days before', trigger: '-P1DT15H' },
  { value: 'morning-of', label: '8 AM on the due date', trigger: 'PT8H' },
  { value: 'none', label: 'No reminder', trigger: null },
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

// The current time in calendar format, like 20261126T180000Z
function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Only unfinished assignments with a due date of today or later
export function upcomingForCalendar(assignments) {
  const today = todayText()
  return assignments.filter((a) => !a.completed && a.dueDate && a.dueDate >= today)
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
      `Priority: ${a.priority}`,
      a.course ? `Course: ${a.course}` : '',
      ...(steps.length > 0 ? ['Steps:', ...steps] : []),
    ]
      .filter(Boolean)
      .join('\n')

    lines.push(
      'BEGIN:VEVENT',
      `UID:${a.id}@student-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(a.dueDate)}`,
      `DTEND;VALUE=DATE:${compactDate(addDays(a.dueDate, 1))}`,
      'TRANSP:TRANSPARENT', // an all day reminder, so it does not block your schedule
      `SUMMARY:${escapeText(`Due: ${a.title}${a.course ? ` (${a.course})` : ''}`)}`,
      `DESCRIPTION:${escapeText(description)}`
    )

    if (reminder.trigger) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(`${a.title} is due`)}`,
        `TRIGGER:${reminder.trigger}`,
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