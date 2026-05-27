import { createContext, useContext, useState, useEffect } from 'react'
import es from './i18n/es'
import en from './i18n/en'
import { useStore } from './store/useStore'

const LANGUAGES = { es, en }

const LanguageContext = createContext({ t: es, lang: 'es', setLang: () => {} })

export function LanguageProvider({ children }) {
  const { profile } = useStore()
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('pandi_lang') || 'es'
  })

  // Sincronizar con el perfil cuando cargue
  useEffect(() => {
    if (profile?.language && profile.language !== lang) {
      setLangState(profile.language)
      localStorage.setItem('pandi_lang', profile.language)
    }
  }, [profile?.language])

  function setLang(newLang) {
    setLangState(newLang)
    localStorage.setItem('pandi_lang', newLang)
  }

  const t = LANGUAGES[lang] || LANGUAGES.es

  return (
    <LanguageContext.Provider value={{ t, lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
