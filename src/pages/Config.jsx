import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { formatCLP, currentPeriod, formatMonthYear } from '../lib/format'

export default function Config() {
  const { user, profile, signOut } = useAuth()
  const navigate                   = useNavigate()
  const time                       = useCurrentTime()
  const { anio, mes }              = currentPeriod()
  const [accounts,   setAccounts]   = useState([])
  const [categories, setCategories] = useState([])
  const [period,     setPeriod]     = useState(null)
  const [section,    setSection]    = useState('cuentas')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    setLoading(true)
    const [{ data: accs }, { data: cats }, { data: per }] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('categories').select('*').eq('user_id', user.id).order('nombre'),
      supabase.from('month_periods').select('*').eq('user_id', user.id).eq('anio', anio).eq('mes', mes).maybeSingle(),
    ])
    setAccounts(accs || [])
    setCategories(cats || [])
    setPeriod(per)
    setLoading(false)
  }

  return (
    <>
      <div className="status-bar">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 20, color: 'var(--text2)' }} />
        </button>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Configuración</span>
        <button onClick={() => navigate('/ayuda')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-help-circle" style={{ fontSize: 20, color: 'var(--text2)' }} />
        </button>
      </div>

      {/* Perfil */}
      <div style={{ background: 'var(--white)', padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--bg)' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--gg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--white)', fontSize: 18, fontWeight: 600
        }}>
          {profile?.nombre?.[0]?.toUpperCase() || 'D'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{profile?.nombre || 'Daniela'}</p>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>{profile?.email}</p>
        </div>
        <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={signOut}>
          Salir
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--white)', borderBottom: '1px solid var(--bg)' }}>
        {[
          { id: 'cuentas', label: 'Cuentas' },
          { id: 'partidas', label: 'Partidas' },
          { id: 'mes', label: formatMonthYear(anio, mes).split(' ')[0] },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setSection(tab.id)}
            style={{
              flex: 1, padding: '10px 4px', border: 'none',
              background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: section === tab.id ? 600 : 400,
              color: section === tab.id ? 'var(--gg)' : 'var(--text2)',
              borderBottom: section === tab.id ? '2px solid var(--gg)' : '2px solid transparent',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {section === 'cuentas'  && <CuentasSection  accounts={accounts}   userId={user.id} onRefresh={load} />}
          {section === 'partidas' && <PartidasSection categories={categories} userId={user.id} onRefresh={load} />}
          {section === 'mes'      && <MesSection period={period} userId={user.id} anio={anio} mes={mes} onRefresh={load} />}
        </>
      )}
    </>
  )
}

/* ---------- Sección Cuentas ---------- */
function CuentasSection({ accounts, userId, onRefresh }) {
  const [showForm,   setShowForm]   = useState(false)
  const [editAccount, setEditAccount] = useState(null)

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta cuenta?')) return
    await supabase.from('accounts').update({ activa: false }).eq('id', id)
    onRefresh()
  }

  const activeAccounts = accounts.filter(a => a.activa)

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 4px' }}>
        <span className="section-label" style={{ padding: 0 }}>Mis cuentas</span>
        <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12 }}
          onClick={() => setShowForm(true)}>
          <i className="ti ti-plus" style={{ fontSize: 14 }} /> Nueva
        </button>
      </div>

      {activeAccounts.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 32 }}>
          <i className="ti ti-wallet" />
          <p>Aún no tienes cuentas.<br />Usa "Nueva" para agregar una.</p>
        </div>
      ) : (
        activeAccounts.map(acc => (
          <div key={acc.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderBottom: '1px solid var(--bg)', background: 'var(--white)'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{acc.nombre}</p>
              <p style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'capitalize' }}>
                {acc.tipo} · Saldo inicial: {formatCLP(acc.saldo_inicial)}
              </p>
            </div>
            <button onClick={() => setEditAccount(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>
              <i className="ti ti-pencil" style={{ fontSize: 15, color: 'var(--text3)' }} />
            </button>
            <button onClick={() => handleDelete(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>
              <i className="ti ti-trash" style={{ fontSize: 15, color: 'var(--text3)' }} />
            </button>
          </div>
        ))
      )}

      {showForm && (
        <AccountForm onClose={() => { setShowForm(false); onRefresh() }} userId={userId} />
      )}
      {editAccount && (
        <AccountForm account={editAccount} onClose={() => { setEditAccount(null); onRefresh() }} userId={userId} />
      )}
    </div>
  )
}

/* ---------- Sección Partidas ---------- */
function PartidasSection({ categories, userId, onRefresh }) {
  const [showForm, setShowForm] = useState(false)

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta partida?')) return
    await supabase.from('categories').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 4px' }}>
        <span className="section-label" style={{ padding: 0 }}>Partidas</span>
        <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12 }}
          onClick={() => setShowForm(true)}>
          <i className="ti ti-plus" style={{ fontSize: 14 }} /> Nueva
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 32 }}>
          <i className="ti ti-tag" />
          <p>Aún no tienes partidas.<br />Usa "Nueva" para agregar una.</p>
        </div>
      ) : (
        categories.map(cat => (
          <div key={cat.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderBottom: '1px solid var(--bg)', background: 'var(--white)'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{cat.nombre}</p>
              {cat.presupuesto_mensual && (
                <p style={{ fontSize: 11, color: 'var(--text2)' }}>
                  Presupuesto: {formatCLP(cat.presupuesto_mensual)}/mes
                </p>
              )}
            </div>
            <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <i className="ti ti-trash" style={{ fontSize: 16, color: 'var(--text3)' }} />
            </button>
          </div>
        ))
      )}

      {showForm && <CategoryForm onClose={() => { setShowForm(false); onRefresh() }} userId={userId} />}
    </div>
  )
}

/* ---------- Sección Mes ---------- */
function MesSection({ period, userId, anio, mes, onRefresh }) {
  const [ingreso,  setIngreso]  = useState(period?.ingreso || '')
  const [arrastre, setArrastre] = useState(period?.saldo_arrastrado || '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('month_periods').upsert({
      user_id: userId, anio, mes,
      ingreso: Number(ingreso) || 0,
      saldo_arrastrado: Number(arrastre) || 0,
    }, { onConflict: 'user_id,anio,mes' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onRefresh()
  }

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>
        Configura los datos de {formatMonthYear(anio, mes)}
      </p>
      <div className="form-group">
        <label className="form-label">Ingreso del mes</label>
        <input className="form-input" type="number" placeholder="0"
          value={ingreso} onChange={e => setIngreso(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Saldo arrastrado del mes anterior</label>
        <input className="form-input" type="number" placeholder="0"
          value={arrastre} onChange={e => setArrastre(e.target.value)} />
      </div>
      <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
        {saved ? <><i className="ti ti-check" /> Guardado</> : saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Guardar'}
      </button>
    </div>
  )
}

/* ---------- Formulario cuenta (crear y editar) ---------- */
function AccountForm({ onClose, userId, account = null }) {
  const isEdit = !!account
  const [form, setForm] = useState({
    nombre: account?.nombre || '',
    tipo: account?.tipo || 'corriente',
    saldo_inicial: account?.saldo_inicial ?? ''
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.nombre) return
    setSaving(true)
    if (isEdit) {
      await supabase.from('accounts').update({
        nombre: form.nombre,
        tipo: form.tipo,
        saldo_inicial: Number(form.saldo_inicial) || 0
      }).eq('id', account.id)
    } else {
      await supabase.from('accounts').insert({
        user_id: userId, nombre: form.nombre,
        tipo: form.tipo, saldo_inicial: Number(form.saldo_inicial) || 0
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
          <span className="sheet__title">{isEdit ? 'Editar cuenta' : 'Nueva cuenta'}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 20, color: 'var(--text2)' }} />
          </button>
        </div>
        <div className="sheet__body">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" placeholder="Ej: Cuenta corriente BCI"
              value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="corriente">Cuenta corriente</option>
              <option value="vista">Cuenta vista / RUT</option>
              <option value="credito">Tarjeta de crédito</option>
              <option value="ahorro">Cuenta ahorro</option>
              <option value="efectivo">Efectivo</option>
              <option value="inversion">Inversión</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Saldo inicial actual</label>
            <input className="form-input" type="number" placeholder="0"
              value={form.saldo_inicial} onChange={e => setForm({...form, saldo_inicial: e.target.value})} />
          </div>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : isEdit ? 'Guardar cambios' : 'Agregar cuenta'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Formulario nueva partida ---------- */
function CategoryForm({ onClose, userId }) {
  const [form, setForm] = useState({ nombre: '', presupuesto_mensual: '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.nombre) return
    setSaving(true)
    await supabase.from('categories').insert({
      user_id: userId, nombre: form.nombre,
      presupuesto_mensual: Number(form.presupuesto_mensual) || null
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet__handle" />
        <div className="sheet__header">
          <span className="sheet__title">Nueva partida</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 20, color: 'var(--text2)' }} />
          </button>
        </div>
        <div className="sheet__body">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" placeholder="Ej: Casa, Familia, Salud…"
              value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Presupuesto mensual (opcional)</label>
            <input className="form-input" type="number" placeholder="0"
              value={form.presupuesto_mensual} onChange={e => setForm({...form, presupuesto_mensual: e.target.value})} />
          </div>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Agregar partida'}
          </button>
        </div>
      </div>
    </div>
  )
}
