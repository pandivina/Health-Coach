import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1 style={{color:'white'}}>Supabase OK</h1>} />
      </Routes>
    </BrowserRouter>
  )
}
