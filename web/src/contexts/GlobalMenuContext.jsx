import { createContext, useContext, useState } from 'react'

const GlobalMenuContext = createContext(null)

export function GlobalMenuProvider({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <GlobalMenuContext.Provider value={{ open, openMenu: () => setOpen(true), closeMenu: () => setOpen(false) }}>
      {children}
    </GlobalMenuContext.Provider>
  )
}

export function useGlobalMenu() {
  const ctx = useContext(GlobalMenuContext)
  if (!ctx) throw new Error('useGlobalMenu must be used within GlobalMenuProvider')
  return ctx
}
