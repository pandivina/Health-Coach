import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeProvider'
import './index.css'
import { GuidedTourProvider } from './contexts/GuidedTourProvider'
import SpotlightOverlay from './components/tour/SpotlightOverlay'
import GuidedTour from './components/tour/GuidedTour'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
  <GuidedTourProvider>
    <App />
    <SpotlightOverlay />
    <GuidedTour />
  </GuidedTourProvider>
</ThemeProvider>
  </React.StrictMode>
)
