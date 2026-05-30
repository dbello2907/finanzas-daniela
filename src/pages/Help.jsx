import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentTime } from '../hooks/useCurrentTime'

const SECTIONS = [
  {
    id: 'inicio',
    icon: 'ti-rocket',
    title: 'Cómo empezar',
    color: 'var(--gg)',
    bg: '#e8f2e8',
    steps: [
      {
        num: '1',
        title: 'Configura tus cuentas',
        body: 'Ve a Configuración → pestaña Cuentas. Agrega cada cuenta bancaria, tarjeta de crédito o efectivo que uses. Indica el saldo que tienes hoy como "Saldo inicial".',
      },
      {
        num: '2',
        title: 'Crea tus partidas',
        body: 'Las partidas son categorías de gasto (Casa, Salud, Alimentación…). Ve a Configuración → pestaña Partidas. Puedes asignarle un presupuesto mensual a cada una y el Dashboard te mostrará cuánto llevas gastado.',
      },
      {
        num: '3',
        title: 'Ingresa tu sueldo del mes',
        body: 'Ve a Configuración → pestaña del mes (ej: Mayo). Escribe tu ingreso total y el saldo que arrastras del mes anterior. Esto permite calcular tu saldo libre.',
      },
    ],
  },
  {
    id: 'asientos',
    icon: 'ti-receipt',
    title: 'Asientos',
    color: 'var(--ds)',
    bg: 'var(--dl)',
    steps: [
      {
        num: '+',
        title: 'Agregar un asiento',
        body: 'Toca el botón rojo + del centro de la barra inferior. Elige si es Gasto, Ingreso o Transferencia, ingresa el monto, la descripción, la fecha y la cuenta.',
      },
      {
        num: '✎',
        title: 'Editar o eliminar',
        body: 'Ve a la pantalla Asientos y toca cualquier registro. Aparece un menú con "Editar asiento" y "Eliminar". Las transferencias eliminan ambos registros del par automáticamente.',
      },
      {
        num: '◀',
        title: 'Ver meses anteriores',
        body: 'En la pantalla Asientos usa las flechas ‹ › para navegar entre meses. Solo verás los registros del mes seleccionado. El contador de registros aparece a la derecha de los filtros.',
      },
      {
        num: '🏷',
        title: 'Tags y notas',
        body: 'Al crear o editar un asiento puedes agregar tags (etiquetas) y una nota de contexto. Son opcionales pero útiles para buscar gastos específicos más adelante.',
      },
    ],
  },
  {
    id: 'dashboard',
    icon: 'ti-home',
    title: 'Dashboard (Inicio)',
    color: 'var(--gg)',
    bg: '#e8f2e8',
    steps: [
      {
        num: '◀',
        title: 'Navegar entre meses',
        body: 'En la barra superior usa las flechas ‹ › junto al nombre del mes para ver el resumen de cualquier mes pasado. La flecha › se desactiva cuando estás en el mes actual.',
      },
      {
        num: '$',
        title: 'Saldo disponible total',
        body: 'Es la suma de los saldos reales de todas tus cuentas activas. Se calcula como saldo inicial + ingresos − gastos.',
      },
      {
        num: '%',
        title: 'Presupuesto del mes',
        body: 'Si tus partidas tienen presupuesto mensual, verás una barra de progreso por cada una. Verde: bajo el 70%, amarillo: entre 70-90%, rojo: sobre el 90%.',
      },
      {
        num: '⚙',
        title: 'Acceder a Configuración',
        body: 'Toca el ícono de engranaje (⚙) en la esquina superior derecha del inicio.',
      },
    ],
  },
  {
    id: 'cuotas',
    icon: 'ti-credit-card',
    title: 'Cuotas TDC',
    color: '#C66F80',
    bg: 'var(--dl)',
    steps: [
      {
        num: '+',
        title: 'Registrar una compra en cuotas',
        body: 'Ve a la pantalla Cuotas y toca +. Ingresa la descripción, el monto total y el número de cuotas. La app calcula la cuota mensual automáticamente y crea los asientos futuros.',
      },
      {
        num: '📅',
        title: 'Forecast mensual',
        body: 'Al final de la pantalla Cuotas aparece una tabla con cuánto debes pagar en cuotas en cada uno de los próximos 12 meses.',
      },
      {
        num: '🗑',
        title: 'Eliminar una cuota',
        body: 'Toca el ícono de basura en la tarjeta de la compra. Esto marca la cuota como inactiva. Los asientos generados quedan en el historial.',
      },
    ],
  },
  {
    id: 'ahorro',
    icon: 'ti-piggy-bank',
    title: 'Metas de Ahorro',
    color: 'var(--gg)',
    bg: '#e8f2e8',
    steps: [
      {
        num: '+',
        title: 'Crear una meta',
        body: 'Ve a la pantalla Ahorro y toca +. Ponle nombre (ej: "Viaje a Europa"), define el monto objetivo y, opcionalmente, una cuenta bancaria asociada y una fecha límite.',
      },
      {
        num: '↑',
        title: 'Abonar a una meta',
        body: 'Toca el botón "Abonar" en la tarjeta de la meta. Ingresa el monto que quieres añadir. Si eliges una cuenta, se creará un asiento de gasto automático en esa cuenta para que tu saldo quede correcto.',
      },
      {
        num: '✓',
        title: 'Meta completada',
        body: 'Cuando el monto acumulado alcance o supere el objetivo, la meta se marca automáticamente como "Completada" y el botón Abonar desaparece.',
      },
    ],
  },
]

function AccordionSection({ section }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ margin: '0 12px 10px', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--gl)', background: 'var(--white)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: section.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`ti ${section.icon}`} style={{ fontSize: 18, color: section.color }} />
        </div>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          {section.title}
        </span>
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`}
          style={{ fontSize: 16, color: 'var(--text3)' }} />
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--bg)' }}>
          {section.steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '12px 16px',
              borderBottom: i < section.steps.length - 1 ? '1px solid var(--bg)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: section.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: section.color,
              }}>
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {step.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Help() {
  const navigate = useNavigate()
  const time     = useCurrentTime()

  return (
    <>
      <div className="status-bar">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 20, color: 'var(--text2)' }} />
        </button>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Cómo usar la app</span>
        <span />
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--gg)', padding: '20px 20px 24px', textAlign: 'center' }}>
        <i className="ti ti-book" style={{ fontSize: 36, color: 'var(--gl)' }} />
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--white)', marginTop: 8 }}>
          Manual de uso
        </p>
        <p style={{ fontSize: 12, color: 'var(--gl)', marginTop: 4, opacity: 0.9 }}>
          Toca cada sección para expandirla
        </p>
      </div>

      <div style={{ paddingTop: 12, paddingBottom: 24 }}>
        {SECTIONS.map(s => <AccordionSection key={s.id} section={s} />)}

        {/* Tip final */}
        <div style={{ margin: '4px 12px 0', padding: '14px 16px', borderRadius: 12, background: 'var(--white)', border: '1px solid var(--gl)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <i className="ti ti-bulb" style={{ fontSize: 18, color: 'var(--gm)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                Consejo
              </p>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                Para que el saldo libre del Dashboard sea correcto, recuerda siempre configurar tu ingreso del mes en Configuración → pestaña del mes actual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
