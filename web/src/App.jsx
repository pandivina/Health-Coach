import HealthTracking from './pages/HealthTracking'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Coach from './pages/Coach'
import Nutrition from './pages/Nutrition'
import Pantry from './pages/Pantry'
import Recipes from './pages/Recipes'
import Workout from './pages/Workout'
import Sleep from './pages/Sleep'
import Mood from './pages/Mood'
import Hydration from './pages/Hydration'
import Smoking from './pages/Smoking'
import DailyReport from './pages/DailyReport'
import Pet from './pages/Pet'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  const { session, profile, loading } = useStore()
  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0a0a12]">
    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
  </div>
  if (!session) return <Navigate to="/auth" replace />
  if (profile && !profile.onboarding_done) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  const { setSession, setUser, fetchProfile, setLoading } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/health" element={<HealthTracking />} />
          <Route path="/" element={<Home />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/hydration" element={<Hydration />} />
          <Route path="/smoking" element={<Smoking />} />
          <Route path="/report" element={<DailyReport />} />
          <Route path="/pet" element={<Pet />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
      }
