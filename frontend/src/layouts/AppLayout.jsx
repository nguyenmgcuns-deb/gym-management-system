import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

// Frame for every logged-in page: sidebar on the left, top bar + page on the right.
export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && <div className="backdrop" onClick={() => setNavOpen(false)} />}
      <div className="main">
        <Topbar onMenu={() => setNavOpen(true)} />
        <Outlet />
      </div>
    </div>
  )
}
