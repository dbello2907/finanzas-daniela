import { useState, useEffect } from 'react'

export function useCurrentTime() {
  const fmt = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 10000)
    return () => clearInterval(id)
  }, [])
  return time
}
