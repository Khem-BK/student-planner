// Saves and applies the accessibility settings

const PREFS_KEY = 'student-planner-preferences'

// Does the computer already have "Increase contrast" turned on?
function systemPrefersHighContrast() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches)
}

export function defaultPreferences() {
  return {
    textSize: 'normal', // 'normal', 'large', or 'xlarge'
    highContrast: systemPrefersHighContrast(),
    shortcuts: true,
  }
}

export function loadPreferences() {
  try {
    const saved = localStorage.getItem(PREFS_KEY)
    return saved ? { ...defaultPreferences(), ...JSON.parse(saved) } : defaultPreferences()
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
  root.dataset.contrast = prefs.highContrast ? 'high' : 'normal'
}