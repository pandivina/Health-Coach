// src/pages/DemoAccess.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Ruta pública temporal para auditoría externa.
// URL: /demo
// ELIMINAR este archivo y la ruta en App.jsx cuando termine la auditoría.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

const DEMO_PROFILE = {
  id:               'demo-user-id',
  name:             'Usuario Demo',
  onboarding_done:  true,
  level:            5,
  xp:               2300,
  streak:           12,
  streak_shields:   1,
  last_active:      new Date().toISOString().split('T')[0],
  goal:             'lose_fat',
  activity_level:   'moderate',
  weight_kg:        78,
  height_cm:        175,
  target_weight_kg: 72,
  sex:              'male',
  pet_type:         'panda',
  pet_name:         'Pandi',
  is_premium:       true,
  motivation_why:   'energy',
  bond_xp:          450,
  bond_level:       3,
}

const DEMO_HEALTH_PROFILE = {
  user_id:                'demo-user-id',
  weight_kg:              78,
  height_cm:              175,
  target_weight_kg:       72,
  bmi:                    25.5,
  bmr:                    1820,
  tdee:                   2821,
  target_calories:        2321,
  target_protein_g:       156,
  target_carbs_g:         280,
  target_fat_g:           72,
  goal:                   'lose_fat',
  goal_intensity:         'moderate',
  activity_level:         'moderate',
  training_days_per_week: 4,
  sleep_hours:            7,
  wake_time:              '07:00',
  sleep_time:             '23:30',
  diet_type:              'omnivore',
  work_schedule:          'day',
  profession:             'Desarrollador',
  is_smoker:              false,
  alcohol_frequency:      'occasional',
  initial_weight_kg:      82,
  initial_bmi:            26.8,
  initial_goal:           'lose_fat',
  onboarding_done:        true,
  onboarding_date:        '2026-01-15T10:00:00Z',
}

export default function DemoAccess() {
  const { setProfile, setUser, setSession, setLoading, setHealthProfile } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    setSession({ access_token: 'demo', user: { id: 'demo-user-id' } })
    setUser({ id: 'demo-user-id', email: 'demo@pandihealthcoach.app' })
    setProfile(DEMO_PROFILE)
    setHealthProfile(DEMO_HEALTH_PROFILE)
    setLoading(false)
    navigate('/home', { replace: true })
  }, [])

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100vh',
      gap:            16,
      background:     '#f0fffe',
    }}>
      <div style={{ fontSize: 64, animation: 'bounce 1s infinite' }}>🐼</div>
      <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>
        Cargando demo…
      </p>
    </div>
  )
}
