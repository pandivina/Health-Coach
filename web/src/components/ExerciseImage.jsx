// web/src/components/ExerciseImage.jsx
// Uso: <ExerciseImage name="Push Up" size={120} showInfo />

import { useState, useEffect } from 'react'
import { getExerciseInfo } from '../lib/exerciseImages'

const MUSCLE_ES = {
  abdominals: 'Abdominales', abductors: 'Abductores', adductors: 'Aductores',
  biceps: 'Bíceps', calves: 'Gemelos', chest: 'Pecho', forearms: 'Antebrazos',
  glutes: 'Glúteos', hamstrings: 'Isquios', lats: 'Dorsales',
  'lower back': 'Lumbar', 'middle back': 'Espalda media', neck: 'Cuello',
  quadriceps: 'Cuádriceps', shoulders: 'Hombros', traps: 'Trapecios',
  triceps: 'Tríceps',
}

const LEVEL_COLOR = { beginner: '#22C55E', intermediate: '#F59E0B', expert: '#EF4444' }
const LEVEL_ES    = { beginner: 'Principiante', intermediate: 'Intermedio', expert: 'Experto' }

// Fallback emoji por nombre de ejercicio
const EMOJI_FALLBACK = {
  'burpee': '🏃', 'tricep dip': '💪', default: '🏋️'
}

export default function ExerciseImage({
  name,
  size       = 120,
  showInfo   = false,
  showSecond = false,   // mostrar segunda imagen (ángulo diferente)
  style      = {},
  onLoad,
}) {
  const [info,    setInfo]    = useState(null)
  const [imgErr,  setImgErr]  = useState(false)
  const [img2Err, setImg2Err] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    setLoading(true); setImgErr(false); setImg2Err(false)
    getExerciseInfo(name).then(data => {
      setInfo(data)
      setLoading(false)
      onLoad?.(data)
    })
  }, [name])

  const fallbackEmoji = EMOJI_FALLBACK[name?.toLowerCase()] || EMOJI_FALLBACK.default

  if (loading) {
    return (
      <div style={{ width:size, height:size, borderRadius:16,
        background:'rgba(0,0,0,0.06)', display:'flex', alignItems:'center',
        justifyContent:'center', ...style }}>
        <div style={{ width:20, height:20, borderRadius:'50%',
          border:'2px solid #2EC4B620', borderTopColor:'#2EC4B6',
          animation:'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ ...style }}>
      {/* Imagen principal */}
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ width:size, height:size, borderRadius:16, overflow:'hidden',
          background:'rgba(0,0,0,0.04)', flexShrink:0, position:'relative' }}>
          {info?.imageUrl && !imgErr ? (
            <img src={info.imageUrl} alt={name}
              onError={() => setImgErr(true)}
              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex',
              alignItems:'center', justifyContent:'center', fontSize:size * 0.4 }}>
              {fallbackEmoji}
            </div>
          )}
        </div>

        {/* Segunda imagen si se pide */}
        {showSecond && info?.imageUrl2 && (
          <div style={{ width:size, height:size, borderRadius:16, overflow:'hidden',
            background:'rgba(0,0,0,0.04)', flexShrink:0 }}>
            {!img2Err ? (
              <img src={info.imageUrl2} alt={`${name} 2`}
                onError={() => setImg2Err(true)}
                style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              <div style={{ width:'100%', height:'100%', display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:size*0.4 }}>
                {fallbackEmoji}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info adicional */}
      {showInfo && info && (
        <div style={{ marginTop:10 }}>
          {info.level && (
            <span style={{ display:'inline-block', fontSize:10, fontWeight:700,
              padding:'3px 8px', borderRadius:8,
              background: (LEVEL_COLOR[info.level] || '#6B7280') + '20',
              color: LEVEL_COLOR[info.level] || '#6B7280',
              marginRight:6, marginBottom:6 }}>
              {LEVEL_ES[info.level] || info.level}
            </span>
          )}
          {info.primaryMuscles?.map(m => (
            <span key={m} style={{ display:'inline-block', fontSize:10, fontWeight:600,
              padding:'3px 8px', borderRadius:8, marginRight:4, marginBottom:4,
              background:'rgba(99,102,241,0.1)', color:'#6366F1' }}>
              {MUSCLE_ES[m] || m}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
