// Saves and applies the accessibility settings

const PREFS_KEY = 'student-planner-preferences'

function matches(query) {
  return Boolean(window.matchMedia && window.matchMedia(query).matches)
}

// Start with whatever the computer is already set to
function systemTheme() {
  if (matches('(prefers-contrast: more)')) return 'contrast'
  if (matches('(prefers-color-scheme: dark)')) return 'dark'
  return 'light'
}

export function defaultPreferences() {
  return {
    textSize: 'normal', // 'normal', 'large', or 'xlarge'
    theme: systemTheme(), // 'light', 'dark', or 'contrast'
    shortcuts: true,
  }
}

export function loadPreferences() {
  try {
    const saved = localStorage.getItem(PREFS_KEY)
    if (!saved) return defaultPreferences()

    const parsed = JSON.parse(saved)

    // Older saves used highContrast: true/false. Convert them.
    if (!parsed.theme && 'highContrast' in parsed) {
      parsed.theme = parsed.highContrast ? 'contrast' : 'light'
    }
    delete parsed.highContrast

    return { ...defaultPreferences(), ...parsed }
  } catch {
    return defaultPreferences()
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

// Put the settings on the <html> tag so the CSS can react to them
export function applyPreferences(prefs) {
  const root = document.documentElement
  root.dataset.textSize = prefs.textSize
  root.dataset.theme = prefs.theme
}