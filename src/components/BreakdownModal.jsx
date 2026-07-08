import { useState, useMemo } from 'react'
import { num } from '../utils/format'
import Modal from './Modal'

// เครื่องคิดเลข ราคา/หน่วย — พอร์ตจาก vanilla breakdown calculator
export default function BreakdownModal({ onClose }) {
  const [base, setBase] = useState('')
  const [levels, setLevels] = useState([{ name: 'กล่อง', qty: 12 }, { name: 'กรัม', qty: 800 }])
  const [extras, setExtras] = useState([])

  const setLevel = (i, patch) => setLevels((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const setExtra = (i, patch) => setExtras((es) => es.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))

  const calc = useMemo(() => {
    const b = num(base)
    const extraSum = extras.reduce((s, e) => s + num(e.cost), 0)
    const total = b + extraSum
    const divisor = levels.reduce((p, l) => p * (num(l.qty) > 0 ? num(l.qty) : 1), 1)
    if (!b || !divisor) return null
    const unitPrice = total / divisor
    const lastName = levels.length && levels[levels.length - 1].name ? levels[levels.length - 1].name : 'หน่วย'
    const levelStr = levels.map((l) => (num(l.qty) || 1) + (l.name ? ' ' + l.name : '')).join(' × ')
    let parts = [b + '฿']
    extras.filter((e) => num(e.cost) > 0).forEach((e) => parts.push('+ ' + num(e.cost) + '฿' + (e.name ? ' (' + e.name + ')' : '')))
    const formula = parts.join(' ') + ' = ' + total.toFixed(2) + '฿ ÷ ' + divisor.toLocaleString() + ' (' + levelStr + ')'
    return { unitPrice, lastName, formula, total, divisor }
  }, [base, levels, extras])

  const INP = { background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 9px', fontSize: 13, fontFamily: "'Sarabun',sans-serif", outline: 'none' }
  const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 90px 30px', gap: 6, alignItems: 'center', marginBottom: 5 }

  return (
    <Modal
      title="🧮 คำนวณราคา/หน่วย"
      subtitle="แตกราคาซื้อยกลัง → ต่อหน่วยเล็กสุด"
      onClose={onClose}
      maxWidth={460}
      footer={<button className="btn btn-red" onClick={onClose}>เสร็จ</button>}
    >
          <div className="mf-card" style={{ padding: '.8rem 1rem' }}>
            <label className="mf-lbl">ราคาที่ซื้อ (฿)</label>
            <input type="number" style={{ ...INP, width: '100%' }} value={base} onChange={(e) => setBase(e.target.value)} placeholder="เช่น 1200" min="0" step="any" autoFocus />
          </div>

          <div className="mf-sec-lbl">แตกหน่วย (1 หน่วยบน = กี่หน่วยล่าง)</div>
          <div className="mf-card" style={{ padding: '.6rem .7rem' }}>
            {levels.map((lv, i) => (
              <div key={i} style={rowStyle}>
                <input style={INP} value={lv.name} onChange={(e) => setLevel(i, { name: e.target.value })} placeholder="ชื่อหน่วย เช่น กล่อง" />
                <input type="number" style={INP} value={lv.qty} onChange={(e) => setLevel(i, { qty: e.target.value })} placeholder="จำนวน" min="1" step="any" />
                <button className="btn-del" onClick={() => setLevels((ls) => ls.filter((_, idx) => idx !== i))}>✕</button>
              </div>
            ))}
            <button className="btn-dashed" style={{ width: '100%', marginTop: 2 }} onClick={() => setLevels((ls) => [...ls, { name: '', qty: '' }])}>＋ เพิ่มหน่วย</button>
          </div>

          <div className="mf-sec-lbl">ค่าใช้จ่ายเพิ่มเติม (ไม่บังคับ)</div>
          <div className="mf-card" style={{ padding: '.6rem .7rem' }}>
            {extras.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--txt3)', padding: '2px 4px 6px' }}>เช่น ค่าขนส่ง</div>}
            {extras.map((ex, i) => (
              <div key={i} style={rowStyle}>
                <input style={INP} value={ex.name} onChange={(e) => setExtra(i, { name: e.target.value })} placeholder="ชื่อ เช่น ค่าขนส่ง" />
                <input type="number" style={INP} value={ex.cost} onChange={(e) => setExtra(i, { cost: e.target.value })} placeholder="฿" min="0" step="any" />
                <button className="btn-del" onClick={() => setExtras((es) => es.filter((_, idx) => idx !== i))}>✕</button>
              </div>
            ))}
            <button className="btn-dashed" style={{ width: '100%', marginTop: 2 }} onClick={() => setExtras((es) => [...es, { name: '', cost: '' }])}>＋ เพิ่มค่าใช้จ่าย</button>
          </div>

          {calc && (
            <div className="mf-card" style={{ padding: '.8rem 1rem', background: 'var(--green-bg)', border: '1px solid var(--green-b)' }}>
              <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>
                {calc.unitPrice.toFixed(6)} <span style={{ fontSize: 14 }}>฿/{calc.lastName}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4, wordBreak: 'break-word' }}>{calc.formula}</div>
            </div>
          )}
    </Modal>
  )
}
