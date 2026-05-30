import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatCLP, formatMonthYear, progressPct } from '../lib/format'

export default function Installments() {
  const { user }          = useAuth()
  const [installments,    setInstallments]    = useState([])
  const [forecast,        setForecast]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [showForm,        setShowForm]        = useState(false)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    setLoading(true)
    await Promise.all([loadInstallments(), loadForecast()])
    setLoading(false)
  }

  async function loadInstallments() {
    const { data } = await supabase
      .from('installments')
      .select('*, accounts(nombre), categories(nombre)')
      .eq('user_id', user.id)
      .eq('activa', true)
      .order('created_at', { ascending: false })
    setInstallments(data || [])
  }

  async function loadForecast() {
    const { data } = await supabase.rpc('get_installments_forecast', {
      p_user_id: user.id, p_meses: 12
    })
    setForecast(data || [])
  }

  const totalMesActual = forecast[0]?.total || 0

  return (
    <>
      <div className="status-bar">
        <span>9:41</span>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Cuotas TDC</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setShowForm(true)}>
          <i className="ti ti-plus" style={{ fontSize: 20, color: 'var(--text2)' }} />
        </button>
      </div>

      {/* Resumen */}
      <div style={{
        background: 'var(--dl)', padding: '16px',
        borderBottom: '1px solid var(--dm)'
      }}>
        <p style={{ fontSize: 12, color: 'var(--ds)', marginBottom: 4 }}>Comprometido este mes</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--ds)' }}>
          {formatCLP(totalMesActual)}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
          {installments.length} compra{installments.length !== 1 ? 's' : ''} activa{installments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <p className="section-label">Compras activas</p>

          {installments.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-credit-card" />
              <p>No hay compras en cuotas activas.</p>
            </div>
          ) : (
            installments.map(inst => <InstallmentCard key={inst.id} inst={inst} onRefresh={load} />)
          )}

          {forecast.length > 0 && (
            <>
              <p className="section-label">Comprometido por mes</p>
              <div style={{ background: 'var(--white)' }}>
                {forecast.map((row, i) => (
                  <div key={`${row.anio}-${row.mes}`} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < forecast.length - 1 ? '1px solid var(--bg)' : 'none'
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>
                      {formatMonthYear(row.anio, row.mes)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds)' }}>
                      {formatCLP(row.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showForm && <InstallmentForm onClose={() => { setShowForm(false); load() }} userId={user.id} />}
    </>
  )
}

function InstallmentCard({ inst, onRefresh }) {
  const pct = progressPct(inst.cuotas_pagadas, inst.num_cuotas)
  const restante = inst.num_cuotas - inst.cuotas_pagadas
  const endDate = new Date(inst.fecha_inicio)
  endDate.setMonth(endDate.getMonth() + inst.num_cuotas - 1)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta cuota?')) return
    await supabase.from('installments').update({ activa: false }).eq('id', inst.id)
    onRefresh()
  }

  return (
    <div style={{ margin: '0 12px 8px', borderRadius: 10, border: '1px solid var(--gl)', overflow: 'hidden', background: 'var(--white)' }}>
      <div style={{
        padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: '1px solid var(--gl)', background: 'var(--dl)'
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{inst.descripcion}</p>
          <p style={{ fontSize: 11, color: 'var(--text2)' }}>
            {inst.accounts?.nombre}{inst.categories?.nombre && ` · ${inst.categories.nombre}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ds)', fontWeight: 600 }}>
            {inst.cuotas_pagadas}/{inst.num_cuotas}
          </span>
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            <i className="ti ti-trash" style={{ fontSize: 14, color: 'var(--text3)' }} />
          </button>
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Cuota mensual</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{formatCLP(inst.cuota_mensual)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Quedan</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{restante} cuotas</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Termina</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {endDate.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Pagado {pct}%</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatCLP(inst.cuota_mensual * inst.cuotas_pagadas)}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%`, background: 'var(--gg)' }} />
        </div>
      </div>
    </div>
  )
}

function InstallmentForm({ onClose, userId }) {
  const [accounts,   setAccounts]   = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    account_id: '', category_id: '', descripcion: '',
    monto_total: '', num_cuotas: '', fecha_inicio: new Date().toISOString().slice(0,7) + '-01'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('accounts').select('id,nombre').eq('user_id', userId).then(({ data }) => setAccounts(data || []))
    supabase.from('categories').select('id,nombre').eq('user_id', userId).then(({ data }) => setCategories(data || []))
  }, [])

  const cuota = form.monto_total && form.num_cuotas
    ? Math.round(Number(form.monto_total) / Number(form.num_cuotas))
    : 0

  async function handleSave() {
    if (!form.account_id || !form.descripcion || !form.monto_total || !form.num_cuotas) return
    setSaving(true)

    const { data: inst } = await supabase.from('installments').insert({
      user_id: userId,
      account_id: form.account_id,
      category_id: form.category_id || null,
      descripcion: form.descripcion,
      monto_total: Number(form.monto_total),
      cuota_mensual: cuota,
      num_cuotas: Number(form.num_cuotas),
      cuotas_pagadas: 0,
      fecha_inicio: form.fecha_inicio,
    }).select().single()

    if (inst) {
      // Generar los N asientos futuros automáticamente
      const entries = []
      for (let i = 0; i < Number(form.num_cuotas); i++) {
        const d = new Date(form.fecha_inicio + 'T00:00:00')
        d.setMonth(d.getMonth() + i)
        const fecha = d.toISOString().slice(0, 10)
        entries.push({
          user_id: userId,
          account_id: form.account_id,
          category_id: form.category_id || null,
          installment_id: inst.id,
          tipo: 'gasto',
          monto: cuota,
          fecha,
          descripcion: `${form.descripcion} (cuota ${i+1}/${form.num_cuotas})`,
          es_fijo: false,
        })
      }
      await supabase.from('entries').insert(entries)
    }

    setSaving(false)
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet__handle" />
        <div className="sheet__header">
          <span className="sheet__title">Nueva compra en cuotas</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 20, color: 'var(--text2)' }} />
          </button>
        </div>
        <div className="sheet__body">
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input className="form-input" placeholder="Ej: Notebook Lenovo"
              value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Monto total</label>
            <input className="form-input" type="number" placeholder="0"
              value={form.monto_total} onChange={e => setForm({...form, monto_total: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">N° cuotas</label>
              <input className="form-input" type="number" min="1" placeholder="12"
                value={form.num_cuotas} onChange={e => setForm({...form, num_cuotas: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Cuota mensual</label>
              <div className="form-input" style={{ color: cuota ? 'var(--gg)' : 'var(--text3)', fontWeight: cuota ? 600 : 400 }}>
                {cuota ? `$${cuota.toLocaleString('es-CL')}` : '—'}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Primera cuota</label>
            <input className="form-input" type="date"
              value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Cuenta</label>
            <select className="form-select" value={form.account_id}
              onChange={e => setForm({...form, account_id: e.target.value})}>
              <option value="">Seleccionar cuenta</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Partida (opcional)</label>
            <select className="form-select" value={form.category_id}
              onChange={e => setForm({...form, category_id: e.target.value})}>
              <option value="">Sin partida</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Guardar cuotas'}
          </button>
        </div>
      </div>
    </div>
  )
}
