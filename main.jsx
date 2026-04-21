import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './WayzaApp.jsx'
import Admin from './AdminConsole.jsx'
import Formulaire from './FormulaireCommercial.jsx'

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ background: "#0D2B30", color: "#F4F7F7", padding: 30, fontFamily: "monospace", minHeight: "100vh" }}>
        <p style={{ color: "#C8920A", fontWeight: "bold", marginBottom: 10 }}>⚠ Erreur WAYZA</p>
        <p style={{ fontSize: 13, color: "rgba(244,247,247,0.7)" }}>{this.state.error.message}</p>
      </div>
    );
    return this.props.children;
  }
}

const route = window.location.pathname
const Root = route.startsWith('/admin') ? Admin
           : route.startsWith('/commercial') ? Formulaire
           : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><ErrorBoundary><Root /></ErrorBoundary></React.StrictMode>
)
