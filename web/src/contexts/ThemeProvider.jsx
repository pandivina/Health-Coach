import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme, getTheme, PET_THEME_MAP, DEFAULT_THEME } from '../lib/themes'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME)
  const [followPetTheme, setFollowPetTheme] = useState(true)
  const [loaded, setLoaded] = useState(false)

  // Cargar preferencias desde Supabase al iniciar
  useEffect(() => {
    // Aplicar tema guardado en localStorage primero (evita flash)
    const savedTheme = localStorage.getItem('hc_theme') || DEFAULT_THEME
    applyTheme(savedTheme)
    setThemeId(savedTheme)

    async function loadPrefs() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoaded(true); return }

      const { data } = await supabase
        .from('user_preferences')
        .select('theme_name, follow_pet_theme')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        const t = data.theme_name || DEFAULT_THEME
        applyTheme(t)
        setThemeId(t)
        setFollowPetTheme(data.follow_pet_theme ?? true)
        localStorage.setItem('hc_theme', t)
      }
      setLoaded(true)
    }
    loadPrefs()

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadPrefs()
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cambiar tema
  const changeTheme = useCallback(async (newThemeId) => {
    applyTheme(newThemeId)
    setThemeId(newThemeId)
    localStorage.setItem('hc_theme', newThemeId)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('user_preferences').upsert({
      user_id: session.user.id,
      theme_name: newThemeId,
      follow_pet_theme: followPetTheme,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }, [followPetTheme])

  // Cambiar si sigue tema de mascota
  const toggleFollowPetTheme = useCallback(async (value) => {
    setFollowPetTheme(value)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('user_preferences').upsert({
      user_id: session.user.id,
      theme_name: themeId,
      follow_pet_theme: value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }, [themeId])

  // Cambiar tema automáticamente cuando cambia la mascota
  const applyPetTheme = useCallback(async (petType) => {
    if (!followPetTheme) return
    const petThemeId = PET_THEME_MAP[petType]
    if (petThemeId && petThemeId !== themeId) {
      await changeTheme(petThemeId)
    }
  }, [followPetTheme, themeId, changeTheme])

  const currentTheme = getTheme(themeId)

  return (
    <ThemeContext.Provider value={{
      themeId,
      theme: currentTheme,
      followPetTheme,
      changeTheme,
      toggleFollowPetTheme,
      applyPetTheme,
      loaded,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
