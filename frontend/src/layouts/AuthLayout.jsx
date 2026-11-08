import Logo from '../ui/Logo'

// Split screen for login / register: brand panel left, form right.
export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo />
        <div>
          <h2>Track every workout, visit and rep.</h2>
          <p>Plan workouts, log sets and weights, check in at the gym, and keep an eye on water and body weight, all in one place.</p>
        </div>
        <p className="muted" style={{ color: '#9fc3be' }}>GymTracker</p>
      </aside>
      <main className="auth__main">
        <div className="auth__card">{children}</div>
      </main>
    </div>
  )
}
