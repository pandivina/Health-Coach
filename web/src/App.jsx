import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import Auth from './pages/Auth'

export default function App() {
  const { setSession, setUser, setLoading } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<h1 style={{color:'white'}}>Home OK</h1>} />
      </Routes>
    </BrowserRouter>
  )
}
