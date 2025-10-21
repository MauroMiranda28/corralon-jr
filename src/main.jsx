// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom' // Importar componentes del router
import App from './App.jsx'
import UpdatePasswordPage from './components/UpdatePasswordPage.jsx' // Importar el nuevo componente (lo crearemos a continuación)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Ruta principal que muestra tu App */}
        <Route path="/*" element={<App />} />
        {/* Ruta específica para actualizar la contraseña */}
        <Route path="/update-password" element={<UpdatePasswordPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)