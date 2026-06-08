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

// ... [El resto de tu código inicial, STATE_CONFIG y ALL_FRAMES igual] ...
// (Mantenemos tus configuraciones exactas)

// ... [Sanctuary component] ...
// He añadido la protección de localStorage dentro del useEffect de los tips:

  useEffect(() => {
    const cacheKey = `pandi_tip_ai_${new Date().toISOString().slice(0, 13)}`
    let cached = null;
    try { cached = localStorage.getItem(cacheKey); } catch (e) { console.warn("LocalStorage bloqueado"); }
    
    if (cached) {
      setTip(cached)
      setTimeout(() => setTipVisible(true), 2000)
      return
    }
    // ... [Tu fetch original] ...
            try { localStorage.setItem(cacheKey, data.tip); } catch (e) {}
    // ...
  }, [])

// ... [DayTask y WaterWidget sin cambios] ...

export default function Home() {
  const { profile, user } = useStore()
  const { theme, loaded } = useTheme()
  const pandiContext = usePandiState();
  const recoveryLight = pandiContext?.recoveryLight || 'GREEN';

  // ... [Tus estados y useEffects originales] ...

  // Si no ha cargado, spinner
  if (!loaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'#f0fffe' }}>
      <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }}>
        <span style={{ fontSize:48 }}>🐾</span>
      </motion.div>
    </div>
  )

  // ... [Lógica de cálculos, const tasks, etc, igual] ...

  return (
    // CAMBIO CLAVE: minHeight: '100dvh' en lugar de 100vh
    <div style={{ minHeight:'100dvh', background:'#f8fafa', paddingBottom:100 }}>
      <Sanctuary recoveryLight={recoveryLight} profile={profile} theme={theme} greeting={greeting} name={name} />

      <div style={{ padding:'0 16px', marginTop:-8 }}>
        {/* ... [Todo tu contenido original] ... */}
        
        {/* ... */}
      </div>
    </div>
  )
}
