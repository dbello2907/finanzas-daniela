import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { todayISO } from '../../lib/format'
import { useNavigate } from 'react-router-dom'

const TIPOS = ['gasto', 'ingreso', 'transferencia']

export default function EntryForm({ onClose }) {
  const { user }         = useAuth()
  const navigate         = useNavigate()
  const [tipo,           setTipo]           = useState('gasto')
  const [monto,          setMonto]          = useState('')
  const [descripcion,    setDescripcion]    = useState('')
  const [accountId,      setAccountId]      = useState('')
  const [accountDestId,  setAccountDestId]  = useState('') // para transferencias
  const [categoryId,     setCategoryId]     = useState('')
  const [fecha,          setFecha]          = useState(todayISO())
  const [nota,           setNota]           = useState('')
  const [tags,           setTags]           = useState([])
  const [newTag,         setNewTag]         = useState('')
  const [esFijo,         setEsFijo]         = useState(false)
  const [accounts,       setAccounts]       = useState([])
  const [categories,     setCategories]     = useState([])
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')

  useEffect(() => {
    supabase.from('accounts').select('id,nombre,tipo').eq('user_id', user.id).eq('activa', true)
      .then(({ data }) => { setAccounts(data || []); if (data?.length) setAccountId(data[0].id) })
    supabase.from('categories').select('id,nombre').eq('user_id', user.id).order('nombre')
      .then(({ data }) => setCategories(data || []))
  }, [user])

  function addTag() {
    const t = newTag.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setNewTag('')
  }

  async function handleSave() {
    if (!monto || Number(monto) <= 0) { setError('Ingresa un monto válido'); return }
    if (!accountId) { setError('Selecciona una cuenta'); return }
    if (tipo === 'transferencia' && !accountDestId) { setError('Selecciona cuenta destino'); return }
    if (tipo === 'transferencia' && accountId === accountDestId) { setError('Las cuentas deben ser distintas'); return }

    setSaving(true)
    setError('')

    const base = {
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId || null,
      tipo,
      monto: Number(monto),
      fecha,
      descripcion: descripcion || (tipo === 'ingreso' ? 'Ingreso' : tipo === 'transferencia' ? 'Transferencia' : 'Gasto'),
      nota: nota || null,
      tags,
      es_fijo: esFijo,
    }

    if (tipo === 'transferencia') {
      const pairId = crypto.randomUUID()
      await supabase.from('entries').insert([
        { ...base, tipo: 'transferencia', transfer_pair: pairId },
        { ...base, account_id: accountDestId, tipo: 'transferencia', transfer_pair: pairId,
          descripcion: `${base.descripcion} (recibido)` }
      ])
    } else {
      await supabase.from('entries').insert(base)
    }

    setSaving(false)
    onClose()
    navigate('/asientos')
  }

  const isTransfer = tipo === 'transferencia'

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet__handle" />
        <div className="sheet__header">
          <span className="sheet__title">Nuevo asiento</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 20, color: 'var(--text2)' }} />
          </button>
        </div>

        <div className="sheet__body">
          {/* Tipo */}
          <div className="type-selector">
            <button
              className={`type-btn type-btn--gasto ${tipo === 'gasto' ? 'active' : ''}`}
              onClick={() => setTipo('gasto')}>
              <i className="ti ti-arrow-up" /> Gasto
            </button>
            <button
              className={`type-btn type-btn--ingreso ${tipo === 'ingreso' ? 'active' : ''}`}
              onClick={() => setTipo('ingreso')}>
              <i className="ti ti-arrow-down" /> Ingreso
            </button>
          </div>

          <button
            onClick={() => setTipo('transferencia')}
            style={{
              width: '100%', padding: '9px', marginBottom: 16,
              borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
              border: `1.5px solid ${tipo === 'transferencia' ? 'var(--gm)' : 'var(--gl)'}`,
              background: tipo === 'transferencia' ? '#f0f4e8' : 'var(--bg)',
              color: tipo === 'transferencia' ? 'var(--gg)' : 'var(--text2)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <i className="ti ti-arrows-exchange" /> Transferencia entre cuentas
          </button>

          {/* Monto */}
          <input
            className="amount-display"
            type="number"
            inputMode="numeric"
            placeholder="$0"
            value={monto}
            onChange={e => setMonto(e.target.value)}
          />

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input className="form-input" placeholder="¿En qué?"
              value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="form-input" type="date"
              value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>

          {/* Cuenta origen */}
          <div className="form-group">
            <label className="form-label">{isTransfer ? 'Cuenta origen' : 'Cuenta'}</label>
            <select className="form-select" value={accountId}
              onChange={e => setAccountId(e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          {/* Cuenta destino (solo transferencia) */}
          {isTransfer && (
            <div className="form-group">
              <label className="form-label">Cuenta destino</label>
              <select className="form-select" value={accountDestId}
                onChange={e => setAccountDestId(e.target.value)}>
                <option value="">Seleccionar</option>
                {accounts.filter(a => a.id !== accountId).map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Partida */}
          {!isTransfer && (
            <div className="form-group">
              <label className="form-label">Partida</label>
              <select className="form-select" value={categoryId}
                onChange={e => setCategoryId(e.target.value)}>
                <option value="">Sin partida</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {tags.map(t => (
                <span key={t} className="tag tag--selected" style={{ cursor: 'pointer' }}
                  onClick={() => setTags(tags.filter(x => x !== t))}>
                  {t} ×
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="Agregar tag…"
                value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()} />
              <button className="btn btn--ghost" style={{ padding: '0 12px', flexShrink: 0 }}
                onClick={addTag}>+</button>
            </div>
          </div>

          {/* Nota */}
          <div className="form-group">
            <label className="form-label">Nota (opcional)</label>
            <textarea className="form-textarea" placeholder="Contexto adicional…"
              value={nota} onChange={e => setNota(e.target.value)} />
          </div>

          {/* ¿Es fijo? */}
          {!isTransfer && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={esFijo} onChange={e => setEsFijo(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--gg)' }} />
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Es un gasto/ingreso recurrente fijo</span>
            </label>
          )}

          {error && (
            <div className="toast toast--error" style={{ position: 'static', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : 'Guardar asiento'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
