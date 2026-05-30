import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeProvider'
import { GuidedTourProvider } from './contexts/GuidedTourProvider'
import { PandiStateProvider } from './contexts/PandiStateContext'
import SpotlightOverlay from './components/tour/SpotlightOverlay'
import GuidedTour from './components/tour/GuidedTour'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <PandiStateProvider>
          <GuidedTourProvider>
            <App />
            <SpotlightOverlay />
            <GuidedTour />
          </GuidedTourProvider>
        </PandiStateProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
)
