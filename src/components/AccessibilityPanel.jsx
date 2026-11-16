import { useEffect, useRef } from 'react'

const TEXT_SIZES = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra large' },
]

function AccessibilityPanel({ prefs, onChange, onReset, onClose }) {
  const headingRef = useRef(null)

  // When the panel opens, move keyboard focus to its heading
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function update(field, value) {
    onChange({ ...prefs, [field]: value })
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') onClose()
  }

  return (
    <section
      id="a11y-panel"
      className="card a11y-panel"
      aria-labelledby="a11y-heading"
      onKeyDown={handleKeyDown}
    >
      <h2 id="a11y-heading" tabIndex="-1" ref={headingRef}>
        Accessibility settings
      </h2>
      <p className="hint">Changes are saved automatically. Press Escape to close.</p>

      <fieldset>
        <legend>Text size</legend>
        <div className="radio-group">
          {TEXT_SIZES.map((size) => (
            <label key={size.value} className="radio-option">
              <input
                type="radio"
                name="textSize"
                value={size.value}
                checked={prefs.textSize === size.value}
                onChange={() => update('textSize', size.value)}
              />
              {size.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="checkbox-option">
        <input
          type="checkbox"
          checked={prefs.highContrast}
          onChange={(e) => update('highContrast', e.target.checked)}
        />
        High contrast mode
      </label>

      <label className="checkbox-option">
        <input
          type="checkbox"
          checked={prefs.shortcuts}
          onChange={(e) => update('shortcuts', e.target.checked)}
        />
        Keyboard shortcuts
      </label>

      {prefs.shortcuts && (
        <div className="shortcut-list">
          <p>Hold Option (Alt on Windows) and press:</p>
          <ul>
            <li><kbd>N</kbd> to add a new assignment</li>
            <li><kbd>L</kbd> to jump to your assignment list</li>
            <li><kbd>A</kbd> to open or close these settings</li>
          </ul>
        </div>
      )}

      <div className="actions">
        <button type="button" onClick={onReset}>
          Reset to defaults
        </button>
        <button type="button" className="primary" onClick={onClose}>
          Close settings
        </button>
      </div>
    </section>
  )
}

export default AccessibilityPanel