import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { ChevronRight, Droplets } from 'lucide-react'

// --- PANDI GREATEST: EL CEREBRO DE LA APP ---
function PandiGreeting({ profile, theme, context }) {
  const { mood, cals, hasWorkout, isMorning } = context;
  const name = profile?.name?.split(' ')[0] || 'Compi';

  // Lógica de decisión del Coach (Aquí puedes ampliar según mood)
  const getMessage = () => {
    if (mood === 1 || mood === 2) return `Te noto bajo de energía hoy. Vamos paso a paso, ¿te parece? 🐼`;
    if (isMorning) return `¡Buenos días, ${name}! He preparado tu día para que sea increíble.`;
    return `Aquí estoy, ${name}. ¿Qué necesitas que revisemos ahora?`;
  };

  return (
    <motion.div className="card mb-6 bg-white border border-teal-100 shadow-sm">
      <div className="flex items-center gap-4">
        <img src="/panda/talk_1.png" className="w-16 h-16" alt="Pandi" />
        <div>
          <h2 className="font-bold text-lg">Hola, {name} 👋</h2>
          <p className="text-sm text-gray-600">{getMessage()}</p>
        </div>
      </div>
      
      {/* Botones de acción directa basados en contexto */}
      <div className="flex gap-2 mt-4">
        {!hasWorkout && <Link to="/workout" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs text-center font-bold">Entrenar hoy</Link>}
        {cals === 0 && <Link to="/nutrition" className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-xs text-center font-bold">Registrar comida</Link>}
      </div>
    </motion.div>
  );
}

// --- HOME COMPONENT REFACTORIZADO ---
export default function Home() {
  const { profile, user } = useStore();
  const { theme, loaded } = useTheme();
  
  // Estados centralizados
  const [data, setData] = useState({ meals: [], workout: null, mood: null, sleep: null });

  useEffect(() => {
    if (!user) return;
    // ... tu lógica actual de carga de datos vía Promise.all ...
  }, [user]);

  // Contexto para el Coach
  const coachingContext = {
    mood: data.mood?.mood,
    cals: data.meals.reduce((s, m) => s + (m.calories || 0), 0),
    hasWorkout: !!data.workout,
    isMorning: new Date().getHours() < 12
  };

  if (!loaded) return <div>Cargando...</div>;

  return (
    <div className="page pb-24 px-4">
      
      {/* Header simplificado */}
      <div className="py-4">
        <p className="text-xs text-gray-400">Tu coach personal</p>
        <h1 className="text-xl font-bold">Panel de Control</h1>
      </div>

      {/* Aquí el Coach integra todo el ruido anterior */}
      <PandiGreeting profile={profile} theme={theme} context={coachingContext} />

      {/* Grid de módulos simplificado */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tus tarjetas de navegación aquí */}
      </div>

      {/* WaterWidget y otros van aquí... */}
      
    </div>
  )
}
