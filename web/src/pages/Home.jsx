import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { usePandiState } from '../contexts/PandiStateContext'
import { supabase } from '../lib/supabase'
import { useTour } from '../hooks/useTour'
import { useSectionContext } from '../hooks/useSectionContext'
import TourHelpButton from '../components/tour/TourHelpButton'
import PandiInsights from '../components/PandiInsights'
import { Plus, Minus as MinusIcon, Droplets } from 'lucide-react'

// (Mantén tus constantes STATE_CONFIG y ALL_FRAMES aquí arriba como las tenías)

export default function Home() {
  // 1. HOOKS: Deben declararse SIEMPRE al inicio y sin interrupciones
  const { profile, user } = useStore()
  const { theme, loaded } = useTheme()
  const pandiContext = usePandiState()
  
  const [todayMeals, setTodayMeals] = useState([])
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [weightLogs, setWeightLogs] = useState([])
  const [todaySleep, setTodaySleep] = useState(null)
  const [todayMood, setTodayMood] = useState(null)
  const [waterGlasses, setWaterGlasses] = useState(0)

  // 2. EFECTOS: Declarados después de los estados
  useTour('home')

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0]
      try {
        const [m, w, g, l, s, mnd, h] = await Promise.all([
          supabase.from('meal_logs').select('calories,protein_g').eq('user_id', user.id).eq('date', today),
          supabase.from('workout_sessions').select('calories_burned').eq('user_id', user.id).eq('status', 'completed').gte('created_at', today+'T00:00:00'),
          supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('weight_logs').select('weight_kg,date').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
          supabase.from('sleep_logs').select('hours,quality').eq('user_id', user.id).eq('date', today).maybeSingle(),
          supabase.from('mood_logs').select('mood').eq('user_id', user.id).eq('date', today).maybeSingle(),
          supabase.from('hydration_logs').select('glasses').eq('user_id', user.id).eq('date', today).maybeSingle(),
        ])
        setTodayMeals(m.data || [])
        setTodayWorkout(w.data?.[0] || null)
        if (g.data) setGoals(g.data)
        setWeightLogs(l.data || [])
        setTodaySleep(s.data || null)
        setTodayMood(mnd.data || null)
        setWaterGlasses(h.data?.glasses || 0)
      } catch (err) { console.error(err) }
    }
    fetchData()
  }, [user])

  // 3. LÓGICA DE DATOS
  const recoveryLight = pandiContext?.recoveryLight || 'GREEN'
  const cals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'
  const name = profile?.name?.split(' ')[0] || 'Compi'

  // 4. CONTROL DE CARGA (Después de todos los hooks)
  if (!loaded) {
    return (
    <div style={{ minHeight:'100dvh', background:'#f8fafa', paddingBottom:100 }}>
      {/* 1. Mantenemos el componente que SÍ se ve */}
      <Sanctuary recoveryLight={recoveryLight} profile={profile} theme={theme} greeting={greeting} name={name} />

      {/* 2. COMENTA TODO LO QUE SIGUE PARA PROBAR */}
      {/* 
      <div style={{ padding:'0 16px', marginTop:-8 }}>
         ... todo tu código de tareas, anillos, etc ...
      </div>
      */}
      
      {/* Añade esto temporalmente para ver si renderiza */}
      <div style={{ padding: 20 }}>
        <p style={{ color: 'black' }}>Si ves este texto, el error está en los componentes de abajo.</p>
      </div>
    </div>
  )
  }

  // 5. RENDERIZADO FINAL
  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafa', paddingBottom: 100 }}>
      {/* 
         Aquí iría tu componente Sanctuary y el resto de los componentes
         que llamaban a los datos calculados arriba.
      */}
      <p>Bienvenido, {name}</p>
    </div>
  )
}
