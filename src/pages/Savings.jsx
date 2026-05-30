import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { formatCLP, formatDateLong, progressPct, todayISO } from '../lib/format'

export default function Savings() {
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const time          = useCurrentTime()
  const [goals,       setGoals]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [abonarGoal,  setAbonarGoal]  = useState(null)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('savings_goals')
      .select('*, accounts(nombre)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }

  const totalAhorrado = goals.reduce((s, g) => s + Number(g.acumulado), 0)
  const totalMeta     = goals.reduce((s, g) => s + Number(g.meta), 0)

  return (
    <>
      <div className="status-bar">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 20, color: 'var(--text2)' }} />
        </button>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Ahorro</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setShowForm(true)}>
          <i className="ti ti-plus" style={{ fontSize: 20, color: 'var(--text2)' }} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--gg)', padding: '18px 20px 20px' }}>
        <p style={{ fontSize: 12, color: 'var(--gl)', marginBottom: 4 }}>Total ahorrado</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
          {formatCLP(totalAhorrado)}
        </p>
        <p style={{ fontSize: 12, color: 'var(--gl)', opacity: 0.8 }}>
          Meta total: {formatCLP(totalMeta)}
        </p>
        {totalMeta > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="progress-bar__fill" style={{
                width: `${progressPct(totalAhorrado, totalMeta)}%`,
                background: 'var(--gl)'
              }} />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-piggy-bank" />
          <p>Aún no tienes metas de ahorro.<br />Crea una con el botón +</p>
        </div>
      ) : (
        <>
          <p className="section-label">Mis metas</p>
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onRefresh={load}
              onAbonar={() => setAbonarGoal(goal)}
            />
          ))}
        </>
      )}

      {showForm && <GoalForm onClose={() => { setShowForm(false); load() }} userId={user.id} />}
      {abonarGoal && (
        <AbonarForm
          goal={abonarGoal}
          userId={user.id}
          onClose={() => { setAbonarGoal(null); load() }}
        />
      )}
    </>
  )
}

function GoalCard({ goal, onRefresh, onAbonar }) {
  const pct      = progressPct(goal.acumulado, goal.meta)
  const restante = Number(goal.meta) - Number(goal.acumulado)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta meta?')) return
    await supabase.from('savings_goals').delete().eq('id', goal.id)
    onRefresh()
  }

  return (
    <div style={{ margin: '0 12px 10px', borderRadius: 12, border: '1px solid var(--gl)', overflow: 'hidden', background: 'var(--white)' }}>
      <div style={{
        padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: '1px solid var(--gl)',
        background: goal.completada ? 'var(--gl)' : 'var(--bg)'
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{goal.nombre}</p>
          {goal.accounts?.nombre && (
            <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{goal.accounts.nombre}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {goal.completada && (
            <span style={{ fontSize: 11, color: 'var(--gg)', fontWeight: 600, background: 'var(--gl)', padding: '2px 8px', borderRadius: 20 }}>
              Completada
            </span>
          )}
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className="ti ti-trash" style={{ fontSize: 14, color: 'var(--text3)' }} />
          </button>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Ahorrado</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gg)' }}>{formatCLP(goal.acumulado)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Meta</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{formatCLP(goal.meta)}</span>
        </div>
        {restante > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Falta</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds)' }}>{formatCLP(restante)}</span>
          </div>
        )}
        {goal.fecha_objetivo && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Fecha objetivo</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{formatDateLong(goal.fecha_objetivo)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}% completado</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{
            width: `${pct}%`,
            background: goal.completada ? 'var(--gg)' : pct > 75 ? 'var(--gg)' : pct > 40 ? 'var(--gm)' : 'var(--ds)'
          }} />
        </div>
        {!goal.completada && (
          <button className="btn btn--ghost" style={{ width: '100%', marginTop: 10, fontSize: 13 }}
            onClick={onAbonar}>
            <i className="ti ti-plus" style={{ fontSize: 16 }} /> Abonar
          </button>
        )}
      </div>
    </div>
  )
}

function AbonarForm({ goal, userId, onClose }) {
  const [monto,     setMonto]     = useState('')
  const [accountId, setAccountId] = useState(goal.account_id || '')
  const [accounts,  setAccounts]  = useState([])
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    supabase.from('accounts').select('id,nombre').eq('user_id', userId).eq('activa', true)
      .then(({ data }) => setAccounts(data || []))
  }, [])

  async function handleSave() {
    if (!monto || Number(monto) <= 0) return
    setSaving(true)
    const nuevo = Number(goal.acumulado) + Number(monto)
    await supabase.from('savings_goals').update({
      acumulado: nuevo,
      completada: nuevo >= Number(goal.meta)
    }).eq('id', goal.id)

    if (accountId) {
      await supabase.from('entries').insert({
        user_id: userId,
        account_id: accountId,
        tipo: 'gasto',
        monto: Number(monto),
        fecha: todayISO(),
        descripcion: `Ahorro: ${goal.nombre}`,
        es_fijo: false,
        tags: ['ahorro'],
      })
    }

    setSaving(false)
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet__handle" />
        <div className="sheet__header">
          <span className="sheet__title">Abonar a "{goal.nombre}"</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 20, color: 'var(--text2)' }} />
          </button>
        </div>
        <div className="sheet__body">
          <input
            className="amount-display"
            type="number"
            inputMode="numeric"
            placeholder="$0"
            value={monto}
            onChange={e => setMonto(e.target.value)}
          />
          <div className="form-group">
            <label className="form-label">Descontar de cuenta (opcional)</label>
            <select className="form-select" value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">Solo actualizar meta</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          {accountId && (
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, marginTop: -8 }}>
              Se creará un asiento de gasto en la cuenta seleccionada.
            </p>
          )}
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : 'Abonar'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function GoalForm({ onClose, userId }) {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({ nombre: '', meta: '', account_id: '', fecha_objetivo: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('accounts').select('id,nombre').eq('user_id', userId).then(({ data }) => setAccounts(data || []))
  }, [])

  async function handleSave() {
    if (!form.nombre || !form.meta) return
    setSaving(true)
    await supabase.from('savings_goals').insert({
      user_id: userId,
      nombre: form.nombre,
      meta: Number(form.meta),
      acumulado: 0,
      account_id: form.account_id || null,
      fecha_objetivo: form.fecha_objetivo || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet__handle" />
        <div className="sheet__header">
          <span className="sheet__title">Nueva meta de ahorro</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 20, color: 'var(--text2)' }} />
          </button>
        </div>
        <div className="sheet__body">
          <div className="form-group">
            <label className="form-label">Nombre de la meta</label>
            <input className="form-input" placeholder="Ej: Viaje a Perú"
              value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Monto objetivo</label>
            <input className="form-input" type="number" placeholder="0"
              value={form.meta} onChange={e => setForm({...form, meta: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Cuenta asociada (opcional)</label>
            <select className="form-select" value={form.account_id}
              onChange={e => setForm({...form, account_id: e.target.value})}>
              <option value="">Sin cuenta específica</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha objetivo (opcional)</label>
            <input className="form-input" type="date"
              value={form.fecha_objetivo} onChange={e => setForm({...form, fecha_objetivo: e.target.value})} />
          </div>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Crear meta'}
          </button>
        </div>
      </div>
    </div>
  )
}
