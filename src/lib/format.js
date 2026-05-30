// Formato de moneda chilena
export function formatCLP(amount) {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

// Formato de fecha corto: "30 may"
export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

// Formato de fecha largo: "30 de mayo de 2026"
export function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Nombre del mes: "Mayo 2026"
export function formatMonthYear(anio, mes) {
  const d = new Date(anio, mes - 1, 1)
  return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

// Fecha actual en formato YYYY-MM-DD (local)
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Mes y año actuales
export function currentPeriod() {
  const d = new Date()
  return { anio: d.getFullYear(), mes: d.getMonth() + 1 }
}

// Agrupa un array de entries por fecha
export function groupByDate(entries) {
  const groups = {}
  entries.forEach(e => {
    if (!groups[e.fecha]) groups[e.fecha] = []
    groups[e.fecha].push(e)
  })
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

// Porcentaje de progreso (capped at 100)
export function progressPct(current, total) {
  if (!total || total === 0) return 0
  return Math.min(100, Math.round((current / total) * 100))
}

// Color de semáforo para presupuesto
export function budgetColor(pct) {
  if (pct >= 90) return 'var(--ds)'
  if (pct >= 70) return 'var(--gm)'
  return 'var(--gg)'
}
