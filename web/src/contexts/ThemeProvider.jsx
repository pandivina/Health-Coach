import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme, getTheme, PET_THEME_MAP, DEFAULT_THEME } from '../lib/themes'

const ThemeContext = createContext(null)

// ── FONT SIZE ────────────────────────────────────────────────
export const FONT_SIZES = {
  normal: { id: 'normal', label: 'Normal',    emoji: 'A',  px: '16px' },
  large:  { id: 'large',  label: 'Grande',    emoji: 'A+', px: '18px' },
  xlarge: { id: 'xlarge', label: 'Muy grande',emoji: 'A++',px: '20px' },
}

export function applyFontSize(sizeId) {
  const size = FONT_SIZES[sizeId] || FONT_SIZES.normal
  document.documentElement.style.fontSize = size.px
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId]           = useState(DEFAULT_THEME)
  const [followPetTheme, setFollowPetTheme] = useState(true)
  const [fontSize, setFontSize]         = useState('normal')
  const [loaded, setLoaded]             = useState(false)

  useEffect(() => {
    // Aplicar tema y fuente guardados en localStorage (evita flash)
    const savedTheme = localStorage.getItem('hc_theme') || DEFAULT_THEME
    const savedFont  = localStorage.getItem('hc_font')  || 'normal'
    applyTheme(savedTheme)
    applyFontSize(savedFont)
    setThemeId(savedTheme)
    setFontSize(savedFont)

    async function loadPrefs() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoaded(true); return }

      const { data } = await supabase
        .from('user_preferences')
        .select('theme_name, follow_pet_theme, font_size')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        const t = data.theme_name || DEFAULT_THEME
        const f = data.font_size  || 'normal'
        applyTheme(t)
        applyFontSize(f)
        setThemeId(t)
        setFontSize(f)
        setFollowPetTheme(data.follow_pet_theme ?? true)
        localStorage.setItem('hc_theme', t)
        localStorage.setItem('hc_font',  f)
      }
      setLoaded(true)
    }

    loadPrefs()

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

  // Cambiar tamaño de fuente
  const changeFontSize = useCallback(async (newSize) => {
    applyFontSize(newSize)
    setFontSize(newSize)
    localStorage.setItem('hc_font', newSize)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('user_preferences').upsert({
      user_id: session.user.id,
      font_size: newSize,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }, [])

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

  return (
    <ThemeContext.Provider value={{
      themeId,
      theme: getTheme(themeId),
      followPetTheme,
      fontSize,
      changeTheme,
      changeFontSize,
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
