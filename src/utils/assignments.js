// Helpers for the list of assignments

import {
  DAYS_TO_KEEP_OVERDUE,
  TRASH_DAYS,
  DAY_MS,
  addDays,
  todayText,
  nowTimeText,
  formatTime,
} from './dates'

const STORAGE_KEY = 'student-planner-assignments'
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

// Read saved assignments, and throw away trash older than TRASH_DAYS
export function loadAssignments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const list = saved ? JSON.parse(saved) : []
    const now = Date.now()
    return list.filter((a) => !a.deletedAt || now - a.deletedAt < TRASH_DAYS * DAY_MS)
  } catch {
    return []
  }
}

export function saveAssignments(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// Due more than 7 days ago?
export function isOld(assignment) {
  return Boolean(
    assignment.dueDate &&
      assignment.dueDate < addDays(todayText(), -DAYS_TO_KEEP_OVERDUE)
  )
}

// Overdue = not done, and the due date has passed (or it is today and the due time has passed)
export function isOverdue(assignment) {
  if (assignment.completed || !assignment.dueDate) return false
  const today = todayText()
  if (assignment.dueDate < today) return true
  return (
    assignment.dueDate === today &&
    Boolean(assignment.dueTime) &&
    assignment.dueTime <= nowTimeText()
  )
}

// Due later today (not done, not overdue yet)
export function isDueToday(assignment) {
  return !assignment.completed && assignment.dueDate === todayText() && !isOverdue(assignment)
}

// "Overdue", "Due today", "Due today at 11:59 PM", or nothing
export function getStatus(assignment) {
  if (isOverdue(assignment)) return { label: 'Overdue', className: 'badge-overdue' }
  if (isDueToday(assignment)) {
    const label = assignment.dueTime
      ? `Due today at ${formatTime(assignment.dueTime)}`
      : 'Due today'
    return { label, className: 'badge-today' }
  }
  return null
}

export function daysLeftInTrash(assignment) {
  const daysPassed = Math.floor((Date.now() - assignment.deletedAt) / DAY_MS)
  return Math.max(TRASH_DAYS - daysPassed, 1)
}

// Make a sorted COPY of the list
export function sortAssignments(list, sortBy) {
  const copy = [...list]
  if (sortBy === 'dueDate') {
    copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      // Same day: earlier time first, and "no time" goes to the end of the day
      return (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99')
    })
  } else if (sortBy === 'priority') {
    copy.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  } else if (sortBy === 'course') {
    copy.sort((a, b) => a.course.localeCompare(b.course))
  }
  return copy
}

// Keep only the assignments that match the chosen filters
export function filterAssignments(list, courseFilter, statusFilter) {
  return list.filter((a) => {
    if (courseFilter !== 'all' && a.course !== courseFilter) return false
    if (statusFilter === 'todo' && a.completed) return false
    if (statusFilter === 'done' && !a.completed) return false
    if (statusFilter === 'overdue' && !isOverdue(a)) return false
    if (statusFilter === 'today' && !isDueToday(a)) return false
    return true
  })
}

// A list of each course name once, A to Z
export function getCourses(list) {
  const names = list.map((a) => a.course).filter(Boolean)
  return [...new Set(names)].sort((x, y) => x.localeCompare(y))
}