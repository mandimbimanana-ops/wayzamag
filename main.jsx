import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './WayzaApp.jsx'
import Admin from './AdminConsole.jsx'
import Formulaire from './FormulaireCommercial.jsx'

const route = window.location.pathname
const Root = route.startsWith('/admin') ? Admin
           : route.startsWith('/commercial') ? Formulaire
           : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)
