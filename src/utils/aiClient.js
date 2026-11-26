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
    throw new Error('The AI helper is not available right now. You can still add assignments by hand.')
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
    throw new Error("The AI's answer could not be read. Please try again or add it by hand.")
  }
}

// AI feature 1: pasted text -> list of suggested assignments (NOT saved yet)
export async function extractAssignments(text) {
  const data = await postJson('/api/ai/extract-assignments', { text, today: todayText() })
  const parsed = extractJson(data.result)
  const list = Array.isArray(parsed.assignments) ? parsed.assignments : []

  // Never trust the AI blindly: check every field of every item
  return list.slice(0, MAX_ITEMS).map((item) => ({
    key: crypto.randomUUID(), // only used on the review screen
    title: String(item.title || '').trim(),
    course: String(item.course || '').trim(),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ? item.dueDate : '',
    priority: PRIORITIES.includes(item.priority) ? item.priority : 'Medium',
    notes: String(item.notes || '').trim(),
  }))
}