import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { formatCLP, formatMonthYear, currentPeriod, progressPct, budgetColor, prevMonth, nextMonth } from '../lib/format'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate          = useNavigate()
  const time              = useCurrentTime()

  const { anio: todayAnio, mes: todayMes } = currentPeriod()
  const [anio,        setAnio]        = useState(todayAnio)
  const [mes,         setMes]         = useState(todayMes)
  const [summary,     setSummary]     = useState(null)
  const [accounts,    setAccounts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [spent,       setSpent]       = useState({})
  const [loading,     setLoading]     = useState(true)

  const isCurrentMonth = anio === todayAnio && mes === todayMes

  function goPrev() { const p = prevMonth(anio, mes); setAnio(p.anio); setMes(p.mes) }
  function goNext() { const p = nextMonth(anio, mes); setAnio(p.anio); setMes(p.mes) }

  useEffect(() => {
    if (user) loadDashboard()
  }, [user, anio, mes])

  async function loadDashboard() {
    setLoading(true)
    await Promise.all([loadSummary(), loadAccounts(), loadCategorySpend()])
    setLoading(false)
  }

  async function loadSummary() {
    const { data } = await supabase.rpc('get_month_summary', {
      p_user_id: user.id, p_anio: anio, p_mes: mes
    })
    if (data?.[0]) setSummary(data[0])
    else setSummary(null)
  }

  async function loadAccounts() {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('activa', true)
      .order('created_at')
    if (data) {
      const withBalance = await Promise.all(data.map(async (acc) => {
        const { data: bal } = await supabase.rpc('get_account_balance', { p_account_id: acc.id })
        return { ...acc, saldo_real: bal ?? acc.saldo_inicial }
      }))
      setAccounts(withBalance)
    }
  }

  async function loadCategorySpend() {
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre')
    if (!cats) return

    const from = `${anio}-${String(mes).padStart(2,'0')}-01`
    const to   = `${anio}-${String(mes).padStart(2,'0')}-31`

    const { data: entries } = await supabase
      .from('entries')
      .select('category_id, monto')
      .eq('user_id', user.id)
      .eq('tipo', 'gasto')
      .gte('fecha', from)
      .lte('fecha', to)

    const spentMap = {}
    entries?.forEach(e => {
      if (e.category_id) spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.monto)
    })

    setCategories(cats)
    setSpent(spentMap)
  }

  const tipoIcon = (tipo) => {
    const icons = { corriente: 'building-bank', vista: 'device-mobile', credito: 'credit-card', efectivo: 'cash', ahorro: 'leaf', inversion: 'chart-line' }
    return icons[tipo] || 'wallet'
  }

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>
  }

  const saldoTotal = accounts.reduce((sum, a) => sum + Number(a.saldo_real || 0), 0)
  const categoriesWithBudget = categories.filter(c => c.presupuesto_mensual)

  return (
    <>
      {/* Status bar con navegación de meses */}
      <div className="status-bar">
        <span>{time}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button onClick={goPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 14, color: 'var(--text2)' }} />
          </button>
          <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
            {formatMonthYear(anio, mes)}
          </span>
          <button onClick={goNext} disabled={isCurrentMonth}
            style={{ background: 'none', border: 'none', padding: '0 4px', lineHeight: 1,
              cursor: isCurrentMonth ? 'default' : 'pointer',
              opacity: isCurrentMonth ? 0.25 : 1 }}>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: 'var(--text2)' }} />
          </button>
        </div>
        <button onClick={() => navigate('/config')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-settings" style={{ fontSize: 20, color: 'var(--text2)' }} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--gg)', padding: '20px 20px 24px' }}>
        <p style={{ fontSize: 12, color: 'var(--gl)', marginBottom: 4 }}>Saldo disponible total</p>
        <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
          {formatCLP(saldoTotal)}
        </p>
        {summary && (
          <p style={{ fontSize: 12, color: 'var(--gl)', opacity: 0.8 }}>
            Ingreso del mes: {formatCLP(summary.ingreso)}
          </p>
        )}
      </div>

      {/* Métricas */}
      {summary && (
        <div className="metric-grid" style={{ paddingBottom: 12 }}>
          <div className="metric-chip">
            <p className="metric-chip__label">Gastado</p>
            <p className="metric-chip__value" style={{ color: 'var(--ds)' }}>
              {formatCLP(summary.total_gastado)}
            </p>
          </div>
          <div className="metric-chip">
            <p className="metric-chip__label">En cuotas</p>
            <p className="metric-chip__value" style={{ color: 'var(--gm)' }}>
              {formatCLP(summary.total_cuotas)}
            </p>
          </div>
          <div className="metric-chip">
            <p className="metric-chip__label">Saldo libre</p>
            <p className="metric-chip__value" style={{ color: 'var(--gg)' }}>
              {formatCLP(summary.saldo_libre)}
            </p>
          </div>
          <div className="metric-chip">
            <p className="metric-chip__label">Arrastrado</p>
            <p className="metric-chip__value" style={{ color: 'var(--text2)' }}>
              {formatCLP(summary.saldo_arrastrado)}
            </p>
          </div>
        </div>
      )}

      {/* Cuentas */}
      <p className="section-label">Mis cuentas</p>
      {accounts.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-wallet" />
          <p>Aún no tienes cuentas.</p>
          <button className="btn btn--ghost" style={{ fontSize: 13, marginTop: 8 }} onClick={() => navigate('/config')}>
            <i className="ti ti-settings" style={{ fontSize: 14 }} /> Ir a Configuración
          </button>
        </div>
      ) : (
        accounts.map((acc, i) => (
          <div key={acc.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px',
            borderBottom: i < accounts.length - 1 ? '1px solid var(--bg)' : 'none',
            background: 'var(--white)'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: acc.tipo === 'credito' ? 'var(--dl)' : acc.tipo === 'ahorro' ? 'var(--gl)' : 'var(--dl)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <i className={`ti ti-${tipoIcon(acc.tipo)}`} style={{
                fontSize: 18,
                color: acc.tipo === 'credito' ? 'var(--ds)' : 'var(--gg)'
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{acc.nombre}</p>
              <p style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'capitalize' }}>{acc.tipo}</p>
            </div>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: Number(acc.saldo_real) < 0 ? 'var(--ds)' : 'var(--text)'
            }}>
              {formatCLP(acc.saldo_real)}
            </span>
          </div>
        ))
      )}

      {/* Presupuesto */}
      {categoriesWithBudget.length > 0 && (
        <>
          <p className="section-label">Presupuesto del mes</p>
          <div style={{ background: 'var(--white)', padding: '4px 0 12px' }}>
            {categoriesWithBudget.map(cat => {
              const gastado = spent[cat.id] || 0
              const pct     = progressPct(gastado, cat.presupuesto_mensual)
              const color   = budgetColor(pct)
              return (
                <div key={cat.id} style={{ padding: '8px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{cat.nombre}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {formatCLP(gastado)} / {formatCLP(cat.presupuesto_mensual)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ height: 16 }} />
    </>
  )
}
