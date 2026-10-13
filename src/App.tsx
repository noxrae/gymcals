import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/Chrome'
import { RestBar } from './components/RestBar'
import { ToastBar } from './components/ToastBar'
import { useStore } from './lib/store'
import { CoachFab } from './components/CoachBits'
import CoachScreen from './screens/Coach'
import DayScreen from './screens/Day'
import ExerciseScreen from './screens/Exercise'
import LogScreen from './screens/Log'
import Onboarding from './screens/Onboarding'
import PlanScreen from './screens/Plan'
import ProgressScreen from './screens/Progress'
import SettingsScreen from './screens/Settings'
import SkillsScreen from './screens/Skills'
import TodayScreen from './screens/Today'
import WorkoutScreen from './screens/Workout'

const TAB_ROUTES = ['/', '/plan', '/progress', '/skills', '/log']

export default function App() {
  const started = useStore((s) => s.settings.startDate != null)
  const { pathname } = useLocation()
  const showTabs = started && TAB_ROUTES.includes(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  if (!started) return <Onboarding />

  return (
    <>
      <Routes>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/plan" element={<PlanScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/skills" element={<SkillsScreen />} />
        <Route path="/log" element={<LogScreen />} />
        <Route path="/day/:dayId" element={<DayScreen />} />
        <Route path="/exercise/:key" element={<ExerciseScreen />} />
        <Route path="/workout/:dayId" element={<WorkoutScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/coach" element={<CoachScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showTabs && <TabBar />}
      {showTabs && <CoachFab />}
      <ToastBar />
      {!pathname.startsWith('/workout') && <RestBar bottom={showTabs ? 'calc(var(--tabbar-h) + 10px)' : 'calc(env(safe-area-inset-bottom) + 96px)'} />}
    </>
  )
}
