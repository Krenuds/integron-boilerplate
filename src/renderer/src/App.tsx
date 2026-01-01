import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Events from './pages/Events'
import Users from './pages/Users'
import TestPanel from './pages/TestPanel'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="events" element={<Events />} />
        <Route path="users" element={<Users />} />
        <Route path="test" element={<TestPanel />} />
      </Route>
    </Routes>
  )
}

export default App
