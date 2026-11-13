import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { addDays, diffDays, eur, fmt, fmtShort, today } from '../lib/dates'
import { EVT_TYPES, assignRole, whoName } from '../lib/method'
import { Empty, Pill, WhoSelect } from '../components/ui'

export default function Events({ box, role, data, reload, toast, log, myCoach }) {
  const t = today()
  const [sel, setSel] = useState(null)
  const [creating, setCreating] = useState(false)
  const owner = role === 'owner'
  const events = [...data.events].sort((a, b) => (a.day < t) - (b.day < t) || (a.day < t ? b.day.localeCompare(a.day) : a.day.localeCompare(b.day)))
  const ev = events.find((e) => e.id === sel)
  const st = (e) => { const ks = data.event_tasks.filter((k) => k.event_id === e.id); const open = ks.filter((k) => !k.done); return { done: ks.length - open.length, total: ks.length, late: open.filter((k) => k.due < t).length } }

  return (
    <div className="stack">
      <div className="card">
        <div className="spread"><div><h2>Événements &amp; projets</h2><p className="sub">Un objectif chiffré, un rétro-planning, qui fait quoi, et un bilan. Repère : un événement par trimestre.</p></div>
          {owner && <button className="btn" onClick={() => { setCreating(true); setSel(null) }}>Nouvel événement</button>}</div>
        <div className="evlist">
          {events.map((e) => { const s = st(e), past = e.day < t; return (
            <button key={e.id} className={'evcard' + (e.id === sel ? ' sel' : '')} onClick={() => { setSel(e.id); setCreating(false) }}>
              <span className="tag teal">{EVT_TYPES[e.type].n}</span><b>{e.name}</b>
              <span className="sub">{fmt(e.day)} · {past ? 'terminé' : 'J-' + diffDays(e.day, t)}</span>
              <div className="track"><div className="fill" style={{ width: (s.total ? s.done / s.total * 100 : 0) + '%' }} /></div>
              <span className="sub">{s.done}/{s.total} tâches{s.late ? ' · ' + s.late + ' en retard' : ''}</span>
            </button>
          ) })}
          {!events.length && <Empty>Aucun événement.</Empty>}
        </div>
      </div>
      {creating && owner && <NewEvent box={box} data={data} toast={toast} log={log} onDone={(id) => { setCreating(false); setSel(id); reload() }} onCancel={() => setCreating(false)} />}
      {ev && <EventDetail ev={ev} box={box} role={role} data={data} reload={reload} toast={toast} log={log} myCoach={myCoach} onDeleted={() => { setSel(null); reload() }} />}
    </div>
  )
}

function NewEvent({ box, data, toast, log, onDone, onCancel }) {
  const [f, setF] = useState({ type: 'porte', name: '', day: addDays(today(), 30), responsible: 'owner', gp: 20, ge: 5, ca: 0, budget: 0 })
  async function save(e) {
    e.preventDefault()
    const { data: ev, error } = await supabase.from('events').insert({ box_id: box.id, type: f.type, name: f.name.trim(), day: f.day, responsible: f.responsible, goal_participants: Number(f.gp) || 0, goal_trials: Number(f.ge) || 0 }).select().single()
    if (error) return toast(error.message)
    const tasks = EVT_TYPES[f.type].tasks.map(([off, r, title], i) => ({ event_id: ev.id, box_id: box.id, title, due: addDays(f.day, off), assignee: assignRole(r, i, data.coaches) }))
    const r1 = await supabase.from('event_tasks').insert(tasks)
    const r2 = await supabase.from('event_finance').insert({ event_id: ev.id, box_id: box.id, budget: Number(f.budget) || 0, goal_revenue: Number(f.ca) || 0 })
    if (r1.error || r2.error) toast((r1.error || r2.error).message)
    await log('Événement créé : ' + ev.name)
    toast(tasks.length + ' tâches créées')
    onDone(ev.id)
  }
  return (
    <div className="card">
      <h2>Nouvel événement</h2>
      <form className="form" onSubmit={save}>
        <label>Type<select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{Object.entries(EVT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.n}</option>)}</select></label>
        <label>Nom<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder="Ex. : Battle de printemps" /></label>
        <label>Date<input type="date" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} required /></label>
        <label>Responsable<WhoSelect value={f.responsible} onChange={(v) => setF({ ...f, responsible: v })} coaches={data.coaches} /></label>
        <label>Participants visés<input type="number" min="0" value={f.gp} onChange={(e) => setF({ ...f, gp: e.target.value })} /></label>
        <label>Essais visés<input type="number" min="0" value={f.ge} onChange={(e) => setF({ ...f, ge: e.target.value })} /></label>
        <label>CA visé (€)<input type="number" min="0" value={f.ca} onChange={(e) => setF({ ...f, ca: e.target.value })} /></label>
        <label>Budget (€)<input type="number" min="0" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></label>
        <div className="row full end"><button type="button" className="btn ghost" onClick={onCancel}>Annuler</button><button className="btn">Créer avec le rétro-planning</button></div>
      </form>
    </div>
  )
}

function EventDetail({ ev, box, role, data, reload, toast, log, myCoach, onDeleted }) {
  const t = today()
  const owner = role === 'owner'
  const fin = data.event_finance.find((x) => x.event_id === ev.id) || { review: {} }
  const tasks = data.event_tasks.filter((k) => k.event_id === ev.id).sort((a, b) => a.due.localeCompare(b.due))
  const phase = (k) => { const d = diffDays(k.due, ev.day); return d <= -15 ? 'Lancement' : d < 0 ? 'Dernière ligne droite' : d === 0 ? 'Jour J' : "Après l'événement" }
  const canTick = (k) => owner || k.assignee === myCoach || k.assignee === 'equipe'
  const [nt, setNt] = useState({ title: '', due: addDays(t, 7), assignee: 'owner' })
  const [rv, setRv] = useState({ participants: fin.review.participants ?? '', essais: fin.review.essais ?? '', inscrits: fin.review.inscrits ?? '', ca: fin.review.ca ?? '', note: fin.review.note ?? '' })

  async function tick(k, done) {
    const { error } = await supabase.from('event_tasks').update({ done, done_at: done ? new Date().toISOString() : null }).eq('id', k.id)
    if (error) return toast(error.message)
    if (done) await log('Tâche faite : ' + k.title + ' (' + ev.name + ')')
    reload()
  }
  async function reassign(k, assignee) {
    const { error } = await supabase.from('event_tasks').update({ assignee }).eq('id', k.id)
    if (error) return toast(error.message)
    reload()
  }
  async function delTask(k) {
    const { error } = await supabase.from('event_tasks').delete().eq('id', k.id)
    if (error) return toast(error.message)
    reload()
  }
  async function addTask(e) {
    e.preventDefault()
    const { error } = await supabase.from('event_tasks').insert({ event_id: ev.id, box_id: box.id, title: nt.title.trim(), due: nt.due, assignee: nt.assignee })
    if (error) return toast(error.message)
    setNt({ ...nt, title: '' })
    reload()
  }
  async function saveReview(e) {
    e.preventDefault()
    const n = (v) => (v === '' ? '' : Number(v))
    const review = { participants: n(rv.participants), essais: n(rv.essais), inscrits: n(rv.inscrits), ca: n(rv.ca), note: rv.note.trim() }
    const { error } = await supabase.from('event_finance').upsert({ event_id: ev.id, box_id: box.id, budget: fin.budget || 0, goal_revenue: fin.goal_revenue || 0, review })
    if (error) return toast(error.message)
    toast('Bilan enregistré')
    reload()
  }
  async function delEvent() {
    if (!window.confirm('Supprimer « ' + ev.name + ' » et ses tâches ?')) return
    const { error } = await supabase.from('events').delete().eq('id', ev.id)
    if (error) return toast(error.message)
    onDeleted()
  }
  function recap() {
    const by = {}
    tasks.filter((k) => !k.done).forEach((k) => (by[k.assignee] = by[k.assignee] || []).push(k))
    const txt = '📣 ' + ev.name + ' · ' + fmt(ev.day) + '\n\n' + Object.entries(by).map(([w, ks]) => '👉 ' + whoName(w, data.coaches) + '\n' + ks.map((k) => '• ' + k.title + ' (avant le ' + fmtShort(k.due) + ')').join('\n')).join('\n\n')
    navigator.clipboard.writeText(txt).then(() => toast('Récap copié : colle-le dans le groupe WhatsApp'), () => toast('Copie impossible'))
  }
  const people = {}
  tasks.forEach((k) => { const p = (people[k.assignee] = people[k.assignee] || { open: 0, late: 0, next: null }); if (!k.done) { p.open++; if (k.due < t) p.late++; if (!p.next || k.due < p.next.due) p.next = k } })
  const done = tasks.filter((k) => k.done).length

  return (
    <>
      <div className="card">
        <div className="spread">
          <div><span className="tag teal">{EVT_TYPES[ev.type].n}</span><h2 style={{ marginTop: 6 }}>{ev.name}</h2>
            <p className="sub">{fmt(ev.day)} · {ev.day < t ? 'terminé' : 'dans ' + diffDays(ev.day, t) + ' jours'} · responsable : {whoName(ev.responsible, data.coaches)}{owner ? ' · budget ' + eur(fin.budget) : ''}</p></div>
          <div className="row"><button className="btn small ghost" onClick={recap}>Copier le récap WhatsApp</button>{owner && <button className="btn small ghost" onClick={delEvent}>Supprimer</button>}</div>
        </div>
        <div className="kpis">
          <div className="kpi"><span>Avancement</span><b>{tasks.length ? Math.round(done / tasks.length * 100) : 0} %</b><span>{done}/{tasks.length} tâches</span></div>
          <div className="kpi"><span>Objectif participants</span><b>{ev.goal_participants}</b>{fin.review.participants !== undefined && fin.review.participants !== '' && <span>réel : {fin.review.participants}</span>}</div>
          <div className="kpi"><span>Objectif essais</span><b>{ev.goal_trials}</b>{fin.review.essais !== undefined && fin.review.essais !== '' && <span>réel : {fin.review.essais}</span>}</div>
          {owner && <div className="kpi"><span>Objectif CA</span><b>{eur(fin.goal_revenue)}</b>{fin.review.ca !== undefined && fin.review.ca !== '' && <span>réel : {eur(fin.review.ca)}</span>}</div>}
        </div>
      </div>
      <div className="grid g2 top">
        <div className="card">
          <h3>Rétro-planning</h3>
          {['Lancement', 'Dernière ligne droite', 'Jour J', "Après l'événement"].map((ph) => {
            const ks = tasks.filter((k) => phase(k) === ph)
            if (!ks.length) return null
            return (
              <div key={ph}>
                <p className="phase">{ph}</p>
                {ks.map((k) => (
                  <div className={'task' + (k.done ? ' done' : '')} key={k.id}>
                    <input type="checkbox" checked={k.done} disabled={!canTick(k)} onChange={(e) => tick(k, e.target.checked)} aria-label={k.title} />
                    <div style={{ flex: 1, minWidth: 160 }}><div className="t">{k.title}</div><div className="sub">{fmt(k.due)}{!k.done && k.due < t ? ' · en retard' : ''}</div></div>
                    {owner ? <WhoSelect value={k.assignee} onChange={(v) => reassign(k, v)} coaches={data.coaches} /> : <span className="sub">{whoName(k.assignee, data.coaches)}</span>}
                    {owner && <button className="btn small ghost" onClick={() => delTask(k)} aria-label="Supprimer la tâche">×</button>}
                  </div>
                ))}
              </div>
            )
          })}
          {owner && (
            <form className="row sep" onSubmit={addTask}>
              <input value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} placeholder="Nouvelle tâche" required style={{ flex: 1, minWidth: 160 }} aria-label="Nouvelle tâche" />
              <input type="date" value={nt.due} onChange={(e) => setNt({ ...nt, due: e.target.value })} aria-label="Échéance" />
              <WhoSelect value={nt.assignee} onChange={(v) => setNt({ ...nt, assignee: v })} coaches={data.coaches} />
              <button className="btn small">Ajouter</button>
            </form>
          )}
        </div>
        <div className="stack">
          <div className="card">
            <h3>Qui fait quoi</h3>
            <table><thead><tr><th>Qui</th><th>Ouvertes</th><th>Retard</th><th>Prochaine tâche</th></tr></thead>
              <tbody>{Object.entries(people).map(([w, p]) => <tr key={w}><td><b>{whoName(w, data.coaches)}</b></td><td>{p.open}</td><td>{p.late ? <Pill cls="bad">{p.late}</Pill> : 0}</td><td className="sub">{p.next ? p.next.title + ' · ' + fmt(p.next.due) : 'tout est fait'}</td></tr>)}</tbody></table>
          </div>
          {owner && (
            <div className="card">
              <h3>Bilan</h3>
              <form className="form" onSubmit={saveReview}>
                <label>Participants<input type="number" min="0" value={rv.participants} onChange={(e) => setRv({ ...rv, participants: e.target.value })} /></label>
                <label>Essais générés<input type="number" min="0" value={rv.essais} onChange={(e) => setRv({ ...rv, essais: e.target.value })} /></label>
                <label>Inscriptions<input type="number" min="0" value={rv.inscrits} onChange={(e) => setRv({ ...rv, inscrits: e.target.value })} /></label>
                <label>CA réalisé (€)<input type="number" min="0" value={rv.ca} onChange={(e) => setRv({ ...rv, ca: e.target.value })} /></label>
                <label className="full">Ce qu'on garde, ce qu'on change<textarea value={rv.note} onChange={(e) => setRv({ ...rv, note: e.target.value })} /></label>
                <div className="row full end"><button className="btn small">Enregistrer le bilan</button></div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
