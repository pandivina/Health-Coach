// ─── components/nutrition/FrequentMeals.jsx ──────────────────────────────────
// Las 3 comidas más registradas — añadir con un tap, sin buscar

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function FrequentMeals({ userId, theme, onQuickAdd }) {
  const [items,   setItems]   = useState([])
  const [adding,  setAdding]  = useState(null)

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  async function load() {
    try {
      const { data } = await supabase
        .from('food_history').select('*')
        .eq('user_id', userId)
        .order('use_count', { ascending: false })
        .limit(3)
      setItems(data || [])
    } catch {
      setItems([])
    }
  }

  async function quickAdd(food) {
    setAdding(food.id || food.food_name)
    await onQuickAdd?.(food)
    setTimeout(() => setAdding(null), 800)
  }

  if (!items.length) return null

  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize:11, fontWeight:800, color:theme.textMuted || '#9CA3AF',
        textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 8px' }}>
        Tus frecuentes
      </p>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
        {items.map((food, i) => {
          const key = food.id || food.food_name
          const isAdding = adding === key
          return (
            <motion.button key={key} whileTap={{ scale:0.95 }}
              onClick={() => quickAdd(food)}
              style={{ flexShrink:0, minWidth:130, padding:'10px 12px', borderRadius:16,
                border:`1px solid ${theme.border || 'rgba(0,0,0,0.08)'}`,
                background: isAdding ? '#ECFDF5' : (theme.surface || 'white'),
                cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:18 }}>{food.emoji || '🍽️'}</span>
                <div style={{ width:22, height:22, borderRadius:'50%',
                  background: isAdding ? '#22C55E' : (theme.primary || '#2EC4B6') + '15',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isAdding
                    ? <span style={{ fontSize:11, color:'white' }}>✓</span>
                    : <Plus size={12} color={theme.primary || '#2EC4B6'} />}
                </div>
              </div>
              <p style={{ fontSize:12, fontWeight:700, color:theme.text || '#1A2332', margin:0,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {food.food_name}
              </p>
              <p style={{ fontSize:10, color:theme.textMuted || '#9CA3AF', margin:0 }}>
                {Math.round(food.calories_per_100g || 0)} kcal/100g
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
