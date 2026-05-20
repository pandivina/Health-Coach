import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeProvider'

export default function Auth() {
  const { theme } = useTheme()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'register') {
        const { data, error: err } = await supabase.auth.signUp({
          email, password, options: { data: { name } },
        })
        if (err) throw err
        if (data.user) {
          await supabase.from('user_profiles').update({ name }).eq('id', data.user.id)
          navigate('/onboarding', { replace: true })
        } else {
          setSuccess('¡Revisa tu email para confirmar la cuenta!')
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        navigate('/home', { replace: true })
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: theme.bg }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <img src="/icons/icon-512.png" alt="Coach" style={{ width: 40, height: 40, borderRadius: 12 }} />
        <h1 className="text-3xl font-extrabold" style={{ background: theme.gradientBrand, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Health Coach
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Tu mejor versión empieza aquí</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-sm">
        <div className="card space-y-4">
          <div className="flex rounded-xl p-1" style={{ background: theme.surface2 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: mode === m ? theme.primary : 'transparent', color: mode === m ? '#fff' : theme.textMuted }}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="label">Nombre</label>
                <input className="input" type="text" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ color: theme.error, background: `${theme.error}15` }}>{error}</p>
            )}
            {success && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ color: theme.success, background: `${theme.success}15` }}>{success}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
