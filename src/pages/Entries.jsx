import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { formatCLP, formatDateShort, groupByDate, currentPeriod, formatMonthYear, prevMonth, nextMonth } from '../lib/format'
import EntryForm from '../components/ui/EntryForm'

export default function Entries() {
  const { user }        = useAuth()
  const time            = useCurrentTime()

  const { anio: todayAnio, mes: todayMes } = currentPeriod()
  const [anio,          setAnio]          = useState(todayAnio)
  const [mes,           setMes]           = useState(todayMes)
  const [entries,       setEntries]       = useState([])
  const [filter,        setFilter]        = useState('todos')
  const [loading,       setLoading]       = useState(true)
  const [actionEntry,   setActionEntry]   = useState(null)
  const [editEntry,     setEditEntry]     = useState(null)

  const isCurrentMonth = anio === todayAnio && mes === todayMes

  function goPrev() { const p = prevMonth(anio, mes); setAnio(p.anio); setMes(p.mes) }
  function goNext() { const p = nextMonth(anio, mes); setAnio(p.anio); setMes(p.mes) }

  useEffect(() => { if (user) loadEntries() }, [user, filter, anio, mes])

  async function loadEntries() {
    setLoading(true)
    const from = `${anio}-${String(mes).padStart(2,'0')}-01`
    const to   = `${anio}-${String(mes).padStart(2,'0')}-31`

    let query = supabase
      .from('entries')
      .select('*, accounts(nombre), categories(nombre,color)')
      .eq('user_id', user.id)
      .gte('fecha', from)
      .lte('fecha', to)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })

    if (filter !== 'todos') query = query.eq('tipo', filter)

    const { data } = await query
    setEntries(data || [])
    setLoading(false)
  }

  async function handleDelete(entry) {
    setActionEntry(null)
    if (!confirm('¿Eliminar este asiento?')) return
    if (entry.transfer_pair) {
      await supabase.from('entries').delete().eq('transfer_pair', entry.transfer_pair)
    } else {
      await supabase.from('entries').delete().eq('id', entry.id)
    }
    loadEntries()
  }

  const grouped = groupByDate(entries)

  return (
    <>
      <div className="status-bar">
        <span>{time}</span>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Asientos</span>
        <span />
      </div>

      {/* Navegador de mes */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: 'var(--white)',
        borderBottom: '1px solid var(--bg)'
      }}>
        <button onClick={goPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 16, color: 'var(--text2)' }} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {formatMonthYear(anio, mes)}
        </span>
        <button onClick={goNext} disabled={isCurrentMonth}
          style={{ background: 'none', border: 'none', padding: '4px 8px',
            cursor: isCurrentMonth ? 'default' : 'pointer',
            opacity: isCurrentMonth ? 0.25 : 1 }}>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, color: 'var(--text2)' }} />
        </button>
      </div>

      {/* Filtros tipo */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px',
        background: 'var(--white)',
        borderBottom: '1px solid var(--bg)'
      }}>
        {['todos','ingreso','gasto'].map(f => (
          <button key={f} className={`pill ${filter === f ? 'pill--active' : 'pill--inactive'}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: f === 'todos' ? 'none' : 'capitalize' }}>
            {f === 'todos' ? 'Todos' : f === 'ingreso' ? 'Ingresos' : 'Gastos'}
          </button>
        ))}
        {entries.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>
            {entries.length} registro{entries.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-receipt" />
          <p>No hay asientos en {formatMonthYear(anio, mes)}.<br />Usa el botón + para agregar uno.</p>
        </div>
      ) : (
        grouped.map(([fecha, items]) => (
          <div key={fecha}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              padding: '10px 16px 4px',
              background: 'var(--bg)'
            }}>
              {formatDateShort(fecha)}
            </div>
            {items.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                last={i === items.length - 1}
                onTap={() => setActionEntry(entry)}
              />
            ))}
          </div>
        ))
      )}

      {/* Action sheet: editar / eliminar */}
      {actionEntry && (
        <div className="sheet-overlay" onClick={() => setActionEntry(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet__handle" />
            <div style={{ padding: '12px 16px 8px' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {actionEntry.descripcion}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                {actionEntry.tipo === 'ingreso' ? '+' : actionEntry.tipo === 'transferencia' ? '' : '-'}
                {formatCLP(actionEntry.monto)}
                {' · '}{formatDateShort(actionEntry.fecha)}
              </p>
            </div>
            <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn--ghost"
                style={{ justifyContent: 'flex-start', gap: 10 }}
                onClick={() => { setEditEntry(actionEntry); setActionEntry(null) }}>
                <i className="ti ti-pencil" style={{ fontSize: 18, color: 'var(--gg)' }} />
                Editar asiento
              </button>
              <button
                className="btn btn--ghost"
                style={{ justifyContent: 'flex-start', gap: 10, borderColor: 'var(--dm)', color: 'var(--ds)' }}
                onClick={() => handleDelete(actionEntry)}>
                <i className="ti ti-trash" style={{ fontSize: 18 }} />
                {actionEntry.transfer_pair ? 'Eliminar transferencia (ambos registros)' : 'Eliminar asiento'}
              </button>
              <button
                className="btn btn--ghost"
                style={{ justifyContent: 'flex-start', gap: 10 }}
                onClick={() => setActionEntry(null)}>
                <i className="ti ti-x" style={{ fontSize: 18, color: 'var(--text3)' }} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {editEntry && (
        <EntryForm
          entry={editEntry}
          onClose={() => { setEditEntry(null); loadEntries() }}
        />
      )}
    </>
  )
}

function EntryRow({ entry, last, onTap }) {
  const isIngreso       = entry.tipo === 'ingreso'
  const isTransferencia = entry.tipo === 'transferencia'
  const dotColor = isIngreso ? 'var(--gg)' : isTransferencia ? 'var(--gm)' : 'var(--ds)'
  const amtColor = isIngreso ? 'var(--gg)' : isTransferencia ? 'var(--text2)' : 'var(--ds)'
  const prefix   = isIngreso ? '+' : isTransferencia ? '' : '-'

  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        borderBottom: last ? 'none' : '1px solid var(--bg)',
        background: 'var(--white)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.descripcion}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text2)' }}>
          {entry.accounts?.nombre}
          {entry.categories?.nombre && ` · ${entry.categories.nombre}`}
          {entry.es_fijo && ' · Fijo'}
          {entry.installment_id && ' · Cuota'}
        </p>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: amtColor, flexShrink: 0 }}>
        {prefix}{formatCLP(entry.monto)}
      </span>
    </div>
  )
}
