import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import EntryForm from '../ui/EntryForm'

export default function AppShell({ children }) {
  const [showEntryForm, setShowEntryForm] = useState(false)

  return (
    <div className="app-shell">
      <div className="page-content">
        {children}
      </div>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) =>
          `bottom-nav__item ${isActive ? 'active' : ''}`}>
          <i className="ti ti-home" />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/asientos" className={({ isActive }) =>
          `bottom-nav__item ${isActive ? 'active' : ''}`}>
          <i className="ti ti-list" />
          <span>Asientos</span>
        </NavLink>

        <button className="bottom-nav__fab" onClick={() => setShowEntryForm(true)}>
          <div className="bottom-nav__fab-circle">
            <i className="ti ti-plus" />
          </div>
          <span>Nuevo</span>
        </button>

        <NavLink to="/cuotas" className={({ isActive }) =>
          `bottom-nav__item ${isActive ? 'active' : ''}`}>
          <i className="ti ti-credit-card" />
          <span>Cuotas</span>
        </NavLink>

        <NavLink to="/ahorro" className={({ isActive }) =>
          `bottom-nav__item ${isActive ? 'active' : ''}`}>
          <i className="ti ti-piggy-bank" />
          <span>Ahorro</span>
        </NavLink>
      </nav>

      {showEntryForm && (
        <EntryForm onClose={() => setShowEntryForm(false)} />
      )}
    </div>
  )
}
