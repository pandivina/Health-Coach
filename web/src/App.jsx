import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1 style={{color:'white'}}>App OK</h1>} />
      </Routes>
    </BrowserRouter>
  )
}
