import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import Icon from '../ui/Icon'

// Close a popover when clicking outside it or pressing Escape.
function useDismiss(open, setOpen) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])
  return ref
}

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const menuRef = useDismiss(menuOpen, setMenuOpen)
  const bellRef = useDismiss(bellOpen, setBellOpen)
  const initial = (user?.first_name?.[0] || '?').toUpperCase()

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu icon-btn" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>

      <div className="user-menu" ref={bellRef}>
        <button type="button" className="topbar__bell" aria-label="Notifications"
          aria-expanded={bellOpen} onClick={() => setBellOpen(!bellOpen)}>
          <Icon name="bell" size={26} />
        </button>
        {bellOpen && (
          <div className="user-menu__list">
            <p className="user-menu__item muted" style={{ cursor: 'default' }}>You're all caught up.</p>
          </div>
        )}
      </div>

      <span className="topbar__divider" />

      <div className="user-menu" ref={menuRef}>
        <button type="button" className="user-menu__btn" aria-haspopup="menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}>
          <span className="avatar">{initial}</span>
          <span className="user-menu__name">{user?.first_name}</span>
          <Icon name="chevronDown" size={20} />
        </button>
        {menuOpen && (
          <div className="user-menu__list" role="menu">
            <div className="user-menu__item muted" style={{ cursor: 'default' }}>{user?.email}</div>
            <Link to="/profile" className="user-menu__item" role="menuitem" onClick={() => setMenuOpen(false)}>
              <Icon name="user" size={18} /> My profile
            </Link>
            <button type="button" className="user-menu__item" role="menuitem" onClick={logout}>
              <Icon name="logout" size={18} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
