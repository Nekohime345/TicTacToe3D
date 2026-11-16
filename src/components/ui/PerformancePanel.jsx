export default function PerformancePanel({ stats }) {
  return (
    <aside className="performance-panel" aria-label="Performance statistics">
      <h2>Performance</h2>
      <div className="performance-fps">
        <strong>{stats.fps}</strong>
        <span>FPS</span>
      </div>
      <dl>
        <div><dt>Frame time</dt><dd>{stats.frameTime.toFixed(1)} ms</dd></div>
        <div><dt>Draw calls</dt><dd>{stats.calls}</dd></div>
        <div><dt>Triangles</dt><dd>{stats.triangles.toLocaleString()}</dd></div>
      </dl>
    </aside>
  )
}
