// Talks to our Spring Boot backend (which talks to Claude)

import { todayText } from './dates'

const PRIORITIES = ['High', 'Medium', 'Low']

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
    throw new Error('The AI helper is not available right now. You can still add the assignment by hand.')
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

// AI feature 1: sentence -> suggested assignment (NOT saved yet)
export async function parseAssignment(text) {
  const data = await postJson('/api/ai/parse-assignment', { text, today: todayText() })
  const parsed = extractJson(data.result)

  // Never trust the AI blindly: check every field
  return {
    title: String(parsed.title || '').trim(),
    course: String(parsed.course || '').trim(),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(parsed.dueDate) ? parsed.dueDate : '',
    priority: PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium',
    notes: String(parsed.notes || '').trim(),
  }
}