// Talks to our Spring Boot backend (which talks to Claude)

import { todayText } from './dates'

const PRIORITIES = ['High', 'Medium', 'Low']
const MAX_ITEMS = 40

async function postJson(url, data) {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    throw new Error('Could not reach the AI helper. Is the backend running?')
  }
  if (!response.ok) {
    throw new Error('The AI helper is not available right now. You can still add things by hand.')
  }
  return response.json()
}

// Claude sometimes adds extra words around the JSON. Keep only the { ... } part.
function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    // Show the AI's raw reply in the browser console (Cmd + Option + J) to help debugging
    console.warn('AI reply that could not be read:', text)
    throw new Error("The AI's answer could not be read. Please try again or add it by hand.")
  }
}

// AI feature 1: pasted text -> list of suggested assignments (NOT saved yet)
export async function extractAssignments(text) {
  const data = await postJson('/api/ai/extract-assignments', { text, today: todayText() })
  const parsed = extractJson(data.result)
  const list = Array.isArray(parsed.assignments) ? parsed.assignments : []

  // Never trust the AI blindly: check every field of every item
  return list.slice(0, MAX_ITEMS).map((item) => {
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ? item.dueDate : ''
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(item.dueTime)
    return {
      key: crypto.randomUUID(),
      title: String(item.title || '').trim(),
      course: String(item.course || '').trim(),
      dueDate,
      dueTime: dueDate && validTime ? item.dueTime : '', // a time only makes sense with a date
      priority: PRIORITIES.includes(item.priority) ? item.priority : 'Medium',
      notes: String(item.notes || '').trim(),
    }
  })
}

// AI feature 2: assignment (+ optional pasted instructions) -> suggested steps,
// or a reason why none are needed (NOT saved yet)
export async function suggestSubtasks(assignment, details = '') {
  const data = await postJson('/api/ai/subtasks', {
    title: assignment.title,
    course: assignment.course || '',
    dueDate: assignment.dueDate || '',
    details,
  })
  const parsed = extractJson(data.result)
  const list = Array.isArray(parsed.subtasks) ? parsed.subtasks : []

  return {
    steps: list
      .map((step) => String(step || '').trim())
      .filter(Boolean)
      .slice(0, 10),
    reason: String(parsed.reason || '').trim(),
  }
}