import { Route, Routes } from 'react-router-dom'

import { Card, PageHeader } from './ui'
import Logo from './ui/Logo'

function Welcome() {
  return (
    <div className="main">
      <Logo light={false} />
      <PageHeader title="GymTracker" subtitle="Frontend structure is ready." />
      <Card title="Next">Pages are added step by step.</Card>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Welcome />} />
    </Routes>
  )
}
