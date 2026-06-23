import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['vybavení', 'pronájem sálu', 'marketing', 'administrativa', 'ostatní']

const CATEGORY_COLORS = {
  'vybavení': '#9B6EA8',
  'pronájem sálu': '#E8956D',
  'marketing': '#C8516B',
  'administrativa': '#6B9EC8',
  'ostatní': '#C4ABB4',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#2C1A22' },
  subtitle: { fontSize: 14, color: '#A08090', marginTop: 4 },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 },
  stat: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, padding: '20px 24px' },
  statLabel: { fontSize: 11, color: '#C4ABB4', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#2C1A22' },
  statSub: { fontSize: 12, color: '#C4ABB4', marginTop: 4 },
  form: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, padding: 24, marginBottom: 28 },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#2C1A22', marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' },
  label: { fontSize: 11, fontWeight: 600, color: '#C4ABB4', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 },
  input: { width: '100%', background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '11px 14px', color: '#2C1A22', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '11px 14px', color: '#2C1A22', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { padding: '11px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', background: '#C8516B', color: '#fff', marginTop: 16 },
  table: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, overflow: 'hidden' },
  tHead: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 60px', padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#C4ABB4', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #EBCFD8' },
  tRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 60px', padding: '14px 24px', borderBottom: '1px solid #F5EEF1', alignItems: 'center', fontSize: 14 },
  catBadge: (cat) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${CATEGORY_COLORS[cat] || '#C4ABB4'}18`, color: CATEGORY_COLORS[cat] || '#C4ABB4', border: `1px solid ${CATEGORY_COLORS[cat] || '#C4ABB4'}44` }),
  deleteBtn: { background: 'none', border: 'none', color: '#EBCFD8', cursor: 'pointer', fontSize: 16, padding: '4px 8px', borderRadius: 6 },
  empty: { padding: '40px 24px', textAlign: 'center', color: '#C4ABB4', fontSize: 14 },
  error: { background: 'rgba(200,81,107,0.08)', border: '1px solid rgba(200,81,107,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C8516B', marginBottom: 16 },
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'ostatní',
    expense_date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => { loadExpenses() }, [])

  async function loadExpenses() {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
    if (data) setExpenses(data)
    setLoading(false)
  }

  async function addExpense() {
    if (!form.description.trim() || !form.amount) { setError('Vyplň popis a částku.'); return }
    const amount = parseInt(form.amount)
    if (isNaN(amount) || amount <= 0) { setError('Částka musí být kladné číslo.'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('expenses').insert({
      description: form.description.trim(),
      amount,
      category: form.category,
      expense_date: form.expense_date,
    })
    if (err) { setError('Chyba při ukládání.') }
    else {
      setForm({ description: '', amount: '', category: 'ostatní', expense_date: new Date().toISOString().slice(0, 10) })
      await loadExpenses()
    }
    setSaving(false)
  }

  async function deleteExpense(id) {
    await supabase.from('expenses').delete().eq('id', id)
    loadExpenses()
  }

  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0)
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthExpenses = expenses.filter(e => e.expense_date.slice(0, 7) === thisMonthKey).reduce((a, e) => a + e.amount, 0)
  const byCategory = {}
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount })
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  return (
    <div>
      <div style={s.header}>
        <div>
          <div style={s.title}>Náklady</div>
          <div style={s.subtitle}>Evidence výdajů na podnikání</div>
        </div>
      </div>

      <div style={s.summaryRow}>
        <div style={s.stat}>
          <div style={s.statLabel}>Celkové náklady</div>
          <div style={{ ...s.statValue, color: '#C8516B' }}>{totalExpenses.toLocaleString('cs-CZ')} Kč</div>
          <div style={s.statSub}>{expenses.length} položek</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Tento měsíc</div>
          <div style={s.statValue}>{thisMonthExpenses.toLocaleString('cs-CZ')} Kč</div>
          <div style={s.statSub}>{now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Největší kategorie</div>
          <div style={{ ...s.statValue, fontSize: topCategory ? 20 : 28, color: topCategory ? CATEGORY_COLORS[topCategory[0]] : '#C4ABB4' }}>
            {topCategory ? topCategory[0] : '–'}
          </div>
          <div style={s.statSub}>{topCategory ? `${topCategory[1].toLocaleString('cs-CZ')} Kč` : 'žádné náklady'}</div>
        </div>
      </div>

      <div style={s.form}>
        <div style={s.formTitle}>➕ Přidat náklad</div>
        {error && <div style={s.error}>⚠️ {error}</div>}
        <div style={s.formGrid}>
          <div>
            <label style={s.label}>Popis</label>
            <input style={s.input} placeholder="např. gumy na cvičení, pronájem sálu..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} onKeyDown={e => e.key === 'Enter' && addExpense()} />
          </div>
          <div>
            <label style={s.label}>Částka (Kč)</label>
            <input style={s.input} type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="1" />
          </div>
          <div>
            <label style={s.label}>Kategorie</label>
            <select style={s.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Datum</label>
            <input style={s.input} type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
          </div>
        </div>
        <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={addExpense} disabled={saving}>
          {saving ? 'Ukládám...' : '+ Přidat náklad'}
        </button>
      </div>

      <div style={s.table}>
        <div style={s.tHead}>
          <span>Popis</span><span>Kategorie</span><span>Datum</span><span>Částka</span><span></span>
        </div>
        {loading && <div style={s.empty}>Načítám...</div>}
        {!loading && expenses.length === 0 && <div style={s.empty}>Zatím žádné náklady.</div>}
        {expenses.map((e, i) => (
          <div key={e.id} style={{ ...s.tRow, background: i % 2 === 0 ? 'transparent' : 'rgba(200,81,107,0.02)' }}>
            <span style={{ fontWeight: 600, color: '#2C1A22' }}>{e.description}</span>
            <span><span style={s.catBadge(e.category)}>{e.category}</span></span>
            <span style={{ color: '#A08090', fontSize: 13 }}>{formatDate(e.expense_date)}</span>
            <span style={{ fontWeight: 700, color: '#C8516B' }}>{e.amount.toLocaleString('cs-CZ')} Kč</span>
            <button style={s.deleteBtn} onClick={() => deleteExpense(e.id)} title="Smazat">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
