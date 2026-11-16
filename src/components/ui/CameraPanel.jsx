import { useRef, useState } from 'react'

export default function CameraPanel({ settings, onChange, onZoomChange, onReset }) {
  const panelRef = useRef(null)
  const dragRef = useRef(null)
  const [panelPosition, setPanelPosition] = useState(null)
  const controls = [
    { group: 'Position', values: settings.position, min: -12, max: 12, step: 0.1, suffix: '' },
    { group: 'Rotation', values: settings.rotation, min: -180, max: 180, step: 1, suffix: '\u00b0' },
  ]

  const handleDragStart = (event) => {
    if (event.target.closest('button')) return

    const bounds = panelRef.current.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDragMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return

    const bounds = panelRef.current.getBoundingClientRect()
    const left = Math.min(Math.max(0, event.clientX - dragRef.current.offsetX), window.innerWidth - bounds.width)
    const top = Math.min(Math.max(0, event.clientY - dragRef.current.offsetY), window.innerHeight - bounds.height)
    setPanelPosition({ left, top })
  }

  const handleDragEnd = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
  }

  return (
    <section
      ref={panelRef}
      className={`camera-panel${panelPosition ? ' camera-panel-moved' : ''}`}
      style={panelPosition ? { left: panelPosition.left, top: panelPosition.top } : undefined}
      aria-label="Camera settings"
    >
      <div
        className="camera-panel-heading drag-handle"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <h2>Camera</h2>
        <span className="drag-hint" aria-hidden="true">Drag</span>
        <button className="reset-button" type="button" onClick={onReset}>Reset</button>
      </div>
      {controls.map(({ group, values, min, max, step, suffix }) => (
        <fieldset className="camera-group" key={group}>
          <legend>{group}</legend>
          {values.map((value, axis) => {
            const axisName = ['X', 'Y', 'Z'][axis]
            return (
              <label className="camera-control" key={`${group}-${axisName}`}>
                <span>{axisName}</span>
                <input
                  aria-label={`${group} ${axisName}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(event) => onChange(group, axis, Number(event.target.value))}
                />
                <output>{Number(value).toFixed(group === 'Position' ? 1 : 0)}{suffix}</output>
              </label>
            )
          })}
        </fieldset>
      ))}
      <label className="camera-control zoom-control">
        <span>Zoom</span>
        <input
          aria-label="Camera zoom"
          type="range"
          min="0.5"
          max="2"
          step="0.01"
          value={settings.zoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
        />
        <output>{`${Math.round(settings.zoom * 100)}%`}</output>
      </label>
    </section>
  )
}
