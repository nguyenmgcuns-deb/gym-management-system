// GymTracker wordmark: dumbbell mark + name
export default function Logo({ light = true }) {
  return (
    <div className={`logo ${light ? 'logo--light' : ''}`}>
      <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="rotate(-35 16 16)">
          <path d="M11 16h10" />
          <path d="M8 10.5v11" />
          <path d="M24 10.5v11" />
          <path d="M4.5 13v6" />
          <path d="M27.5 13v6" />
        </g>
      </svg>
      <span>GymTracker</span>
    </div>
  )
}
