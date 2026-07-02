import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import CookieBanner from './components/legal/CookieBanner'
import UpdateBanner from './components/UpdateBanner'
import { ToastProvider } from './components/ToastProvider'
import { AchievementToastProvider } from './components/AchievementPopup'
import { CoachAwarenessProvider } from './contexts/CoachAwarenessContext'
import AppErrorBoundary from './components/AppErrorBoundary'
import { GlobalMenuProvider } from './contexts/GlobalMenuContext'

// ─── EAGER: rutas críticas del arranque ───────────────────────────────────────
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Home from './pages/Home'

// ─── LAZY: todo lo demás se carga al navegar ──────────────────────────────────
const Onboarding       = lazy(() => import('./pages/Onboarding'))
const Coach            = lazy(() => import('./pages/Coach'))
const DailyReport      = lazy(() => import('./pages/DailyReport'))
const Profile          = lazy(() => import('./pages/Profile'))
const Premium          = lazy(() => import('./pages/Premium'))
const Appearance       = lazy(() => import('./pages/Appearance'))
const Pet              = lazy(() => import('./pages/Pet'))
const Nutrition        = lazy(() => import('./pages/Nutrition'))
const WorkoutView      = lazy(() => import('./pages/WorkoutView'))
const Sleep            = lazy(() => import('./pages/Sleep'))
const Mood             = lazy(() => import('./pages/Mood'))
const EspejoMetabolico = lazy(() => import('./pages/EspejoMetabolico'))
const Hydration        = lazy(() => import('./pages/Hydration'))
const Smoking          = lazy(() => import('./pages/Smoking'))
const HealthTracking   = lazy(() => import('./pages/HealthTracking'))
const Calendar         = lazy(() => import('./pages/Calendar'))
const Achievements     = lazy(() => import('./pages/Achievements'))
const MisRecetas       = lazy(() => import('./pages/MisRecetas'))
const PrivacyPage      = lazy(() => import('./pages/Legal').then(m => ({ default: m.PrivacyPolicy })))
const TermsPage        = lazy(() => import('./pages/Legal').then(m => ({ default: m.TermsOfUse })))
const DisclaimerPage   = lazy(() => import('./pages/Legal').then(m => ({ default: m.MedicalDisclaimerPage })))

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#fff', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 40 }} className="animate-bounce">🐾</div>
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
  const { setSession, setUser, fetchProfile, setLoading, setProfile, setHealthProfile } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
          .then(() => useStore.getState().initCoach())
          .finally(() => setLoading(false))
      } else {
        setProfile(null)
        setHealthProfile(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setHealthProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AppErrorBoundary>
      <GlobalMenuProvider>
      <ToastProvider>
        <AchievementToastProvider>
          <CoachAwarenessProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<SmartRoot />} />
                  <Route path="/auth"        element={<Auth />} />
                  <Route path="/onboarding"  element={<Onboarding />} />
                  <Route path="/privacy"     element={<PrivacyPage />} />
                  <Route path="/terms"       element={<TermsPage />} />
                  <Route path="/disclaimer"  element={<DisclaimerPage />} />

                  <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="/calendar"     element={<Calendar />} />
                    <Route path="/home"         element={<Home />} />
                    <Route path="/coach"        element={<Coach />} />
                    <Route path="/report"       element={<DailyReport />} />
                    <Route path="/profile"      element={<Profile />} />
                    <Route path="/premium"      element={<Premium />} />
                    <Route path="/appearance"   element={<Appearance />} />
                    <Route path="/pet"          element={<Pet />} />
                    <Route path="/nutrition"    element={<Nutrition />} />
                    <Route path="/pantry"       element={<Navigate to="/nutrition" replace />} />
                    <Route path="/recipes"      element={<Navigate to="/nutrition" replace />} />
                    <Route path="/workout"      element={<WorkoutView />} />
                    <Route path="/sleep"        element={<Sleep />} />
                    <Route path="/mood"         element={<Mood />} />
                    <Route path="/mis-recetas"  element={<MisRecetas />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/sanctuary"    element={<Navigate to="/mood" replace />} />
                    <Route path="/espejo"       element={<EspejoMetabolico />} />
                    <Route path="/hydration"    element={<Hydration />} />
                    <Route path="/smoking"      element={<Smoking />} />
                    <Route path="/health"       element={<HealthTracking />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <CookieBanner />
              <UpdateBanner />
            </BrowserRouter>
          </CoachAwarenessProvider>
        </AchievementToastProvider>
      </ToastProvider>
      </GlobalMenuProvider>
    </AppErrorBoundary>
  )
}
