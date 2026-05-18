import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import Appearance from './pages/Appearance'

// Auth
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'

// Core
import Home from './pages/Home'
import Coach from './pages/Coach'
import DailyReport from './pages/DailyReport'
import Profile from './pages/Profile'

// Nutrition hub
import Nutrition from './pages/Nutrition'

// Fitness
import Workout from './pages/Workout'

// Wellness
import Sleep from './pages/Sleep'
import Mood from './pages/Mood'
import Hydration from './pages/Hydration'
import Smoking from './pages/Smoking'

// Health tracking
import HealthTracking from './pages/HealthTracking'

// Gamification
import Pet from './pages/Pet'

// Premium
import Premium from './pages/Premium'

// Legacy routes (kept for backwards compatibility)
import Pantry from './pages/Pantry'
import Recipes from './pages/Recipes'

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a12] flex-col gap-4">
      <div className="text-4xl animate-bounce">🐼</div>
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { session, profile, loading } = useStore()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/auth" replace />

  // Si tiene sesión pero no ha completado el onboarding
  if (profile !== null && !profile?.onboarding_done) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default function App() {
  const { setSession, setUser, fetchProfile, setLoading, setProfile } = useStore()

  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Rutas protegidas con Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Core */}
          <Route path="/" element={<Home />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/report" element={<DailyReport />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/appearance" element={<Appearance />} />

          {/* Nutrición hub (incluye despensa y recetas) */}
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/pantry" element={<Navigate to="/nutrition" replace />} />
          <Route path="/recipes" element={<Navigate to="/nutrition" replace />} />

          {/* Fitness */}
          <Route path="/workout" element={<Workout />} />

          {/* Wellness */}
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/hydration" element={<Hydration />} />
          <Route path="/smoking" element={<Smoking />} />

          {/* Health tracking */}
          <Route path="/health" element={<HealthTracking />} />

          {/* Gamificación */}
          <Route path="/pet" element={<Pet />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
