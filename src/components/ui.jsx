import { useEffect, useState } from 'react'
import { PALETTE } from '../lib/method'

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="spread"><h2>{title}</h2><button className="btn ghost small" onClick={onClose}>Fermer</button></div>
        {children}
      </div>
    </div>
  )
}

export function Pill({ cls = 'neutral', children, title }) {
  return <span className={'pill ' + cls} title={title}>{children}</span>
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>
}

export function TypeTag({ name, types }) {
  const t = (types || []).find((x) => x.name === name)
  const p = PALETTE[(t ? t.color_index : 7) % PALETTE.length]
  return <span className="tag" style={{ background: p[0], color: p[1] }}>{name}</span>
}

let toastTimer
export function useToast() {
  const [msg, setMsg] = useState('')
  const show = (m) => {
    setMsg(m)
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setMsg(''), 2800)
  }
  const node = msg ? <div className="toast" role="status">{msg}</div> : null
  return [show, node]
}

export function statusOf(due, ref) {
  const d = Math.round((new Date(due) - new Date(ref)) / 864e5)
  if (d < 0) return { cls: 'bad', txt: 'En retard de ' + -d + ' j' }
  if (d === 0) return { cls: 'warn', txt: "Aujourd'hui" }
  if (d <= 7) return { cls: 'warn', txt: 'Dans ' + d + ' j' }
  return { cls: 'good', txt: 'Dans ' + d + ' j' }
}

export function WhoSelect({ value, onChange, coaches, id }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Qui">
      <option value="owner">Owner</option>
      {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      <option value="equipe">Toute l'équipe</option>
    </select>
  )
}
