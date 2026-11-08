import { NavLink } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import Icon from '../ui/Icon'
import Logo from '../ui/Logo'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/gym', label: 'Gym sessions', icon: 'calendar' },
  { to: '/workouts', label: 'Workout plans', icon: 'dumbbell' },
  { to: '/exercises', label: 'Exercises', icon: 'grid' },
  { to: '/water', label: 'Water tracking', icon: 'droplet' },
  { to: '/weight', label: 'Weight tracking', icon: 'scale' },
  { to: '/stats', label: 'Statistics', icon: 'chart' },
  { to: '/history', label: 'Workout history', icon: 'history' },
  { to: '/profile', label: 'My profile', icon: 'user' },
]

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth()

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Main navigation">
      <div className="sidebar__brand">
        <Logo />
        <button type="button" className="sidebar__close icon-btn" onClick={onClose} aria-label="Close menu">
          <Icon name="close" />
        </button>
      </div>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="sidebar__link" onClick={onClose}>
            <Icon name={item.icon} size={22} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="sidebar__link sidebar__logout" onClick={logout}>
        <Icon name="logout" size={22} />
        Log out
      </button>
    </aside>
  )
}
