export const DAY = 864e5
export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
export const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export const iso = (d) => {
  const x = new Date(d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}
export const today = () => iso(new Date())
export const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s, n) => iso(parse(s).getTime() + n * DAY)
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY)
export const wdOf = (s) => (parse(s).getDay() + 6) % 7
export const fmt = (s) => {
  if (!s) return '—'
  const d = parse(s)
  return d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear()
}
export const fmtShort = (s) => {
  const d = parse(s)
  return d.getDate() + ' ' + MOIS[d.getMonth()]
}
export const hhmm = (t) => (t || '').slice(0, 5)
export const eur = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €'
export const num = (n, d = 0) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d })
