import { AchievementToastProvider } from './components/AchievementPopup'
import Achievements from './pages/Achievements'
import Calendar from './pages/Calendar'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import CookieBanner from './components/legal/CookieBanner'
import { PrivacyPolicy, TermsOfUse, MedicalDisclaimerPage } from './pages/Legal'
import UpdateBanner from './components/UpdateBanner'
import WorkoutView from './pages/WorkoutView'
import { ToastProvider } from './components/ToastProvider'
import { CoachAwarenessProvider } from './contexts/CoachAwarenessContext'
import AppErrorBoundary from './components/AppErrorBoundary'


// Public
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'

// Core
import Home from './pages/Home'
import Coach from './pages/Coach'
import DailyReport from './pages/DailyReport'
import Profile from './pages/Profile'
import Premium from './pages/Premium'
import Appearance from './pages/Appearance'
import Pet from './pages/Pet'

// Nutrition
import Nutrition from './pages/Nutrition'

// Fitness
import Workout from './pages/Workout'

// Wellness
import Sleep from './pages/Sleep'
import Mood from './pages/Mood'
import Sanctuary from './pages/Sanctuary'
import Hydration from './pages/Hydration'
import Smoking from './pages/Smoking'

// Health tracking
import HealthTracking from './pages/HealthTracking'

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#fff', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 40 }} className="animate-bounce">🐼</div>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #2EC4B620', borderTopColor: '#2EC4B6',
      }} className="animate-spin" />
    </div>
  )
}

function SmartRoot() {
  const { session, profile, loading } = useStore()
  if (loading) return <LoadingScreen />
  if (!session) return <Landing />
  if (profile !== null && !profile?.onboarding_done) return <Navigate to="/onboarding" replace />
  return <Navigate to="/home" replace />
}

function ProtectedRoute({ children }) {
  const { session, profile, loading } = useStore()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/auth" replace />
  if (profile !== null && !profile?.onboarding_done) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  // ── setHealthProfile añadido ──────────────────────────────────────────────
  const { setSession, setUser, fetchProfile, setLoading, setProfile, setHealthProfile } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // fetchProfile ahora carga ambas tablas en paralelo
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setHealthProfile(null)   // ← limpiar health profile en logout
        setLoading(false)
      }
      if (session?.user) {
  fetchProfile(session.user.id)
    .then(() => useStore.getState().initCoach())
    .finally(() => setLoading(false))
}
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setHealthProfile(null)   // ← limpiar health profile en logout
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AppErrorBoundary>
      <ToastProvider>
    <AchievementToastProvider>
      <CoachAwarenessProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<SmartRoot />} />

            <Route path="/auth"        element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
          
            
            <Route path="/privacy"     element={<PrivacyPolicy />} />
            <Route path="/terms"       element={<TermsOfUse />} />
            <Route path="/disclaimer"  element={<MedicalDisclaimerPage />} />
            <Route path="/achievements" element={<Achievements />} />
            
            

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/calendar"  element={<Calendar />} />
              <Route path="/home"      element={<Home />} />
              <Route path="/coach"     element={<Coach />} />
              <Route path="/report"    element={<DailyReport />} />
              <Route path="/profile"   element={<Profile />} />
              <Route path="/premium"   element={<Premium />} />
              <Route path="/appearance" element={<Appearance />} />
              <Route path="/pet"       element={<Pet />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/pantry"    element={<Navigate to="/nutrition" replace />} />
              <Route path="/recipes"   element={<Navigate to="/nutrition" replace />} />
              <Route path="/workout"   element={<WorkoutView />} />
              <Route path="/sleep"     element={<Sleep />} />
              <Route path="/mood"      element={<Mood />} />
            <Route path="/sanctuary" element={<Sanctuary />} />
              <Route path="/hydration" element={<Hydration />} />
              <Route path="/smoking"   element={<Smoking />} />
              <Route path="/health"    element={<HealthTracking />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CookieBanner />
          <UpdateBanner />
        </BrowserRouter>
        </CoachAwarenessProvider>
        </AchievementToastProvider>
      </ToastProvider>
    </AppErrorBoundary>
  )
}
