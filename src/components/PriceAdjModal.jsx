import { useState } from 'react'
import { num, fmtDateNow, baht } from '../utils/format'
import Modal from './Modal'

export default function PriceAdjModal({ item, updatedBy, onSave, onClose }) {
  const [price, setPrice] = useState('')
  const [trend, setTrend] = useState(null) // '⬆️' | '⬇️'
  const [supplier, setSupplier] = useState(null) // 'Mixue HQ' | 'External Market'
  const [reason, setReason] = useState('')

  const hist = item.priceHistory || []

  const save = () => {
    const np = num(price)
    if (!np || np <= 0) return alert('กรุณาใส่ราคาใหม่ที่ถูกต้อง')
    if (!trend) return alert('กรุณาเลือกทิศทางราคา')
    if (!supplier) return alert('กรุณาเลือกแหล่งที่มา')
    const record = {
      price: np, trend, reason: reason.trim() || '—', supplier,
      updatedAt: new Date().toISOString(), updatedBy,
    }
    // อัปเดตราคา — สูตรเดียวกับ saveIngr: (base+freight)×(1+waste/100)/divisor
    const next = {
      ...item,
      priceHistory: [...hist, record],
      total: np, basePrice: np,
      updatedAt: fmtDateNow(), updatedBy,
    }
    if (num(item.qty) > 0) {
      const effBase = (np + num(item.freight)) * (1 + num(item.waste) / 100)
      next.unitPrice = effBase / num(item.qty)
    }
    onSave(next)
  }

  const trendBtn = (t, label, activeColor) => (
    <button onClick={() => setTrend(t)} style={{
      flex: 1, padding: '8px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
      border: '1.5px solid ' + (trend === t ? activeColor : 'var(--border2)'),
      background: trend === t ? activeColor + '18' : '#fff', color: trend === t ? activeColor : 'var(--txt2)',
    }}>{label}</button>
  )
  const supBtn = (s, label) => (
    <button onClick={() => setSupplier(s)} style={{
      flex: 1, padding: '7px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
      border: '1.5px solid ' + (supplier === s ? 'var(--red)' : 'var(--border2)'),
      background: supplier === s ? 'var(--red-p)' : '#fff', color: supplier === s ? 'var(--red)' : 'var(--txt2)',
    }}>{label}</button>
  )
  const INP = { width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: "'Sarabun',sans-serif", outline: 'none' }

  return (
    <Modal
      title="↕️ ปรับราคา"
      subtitle={`${item.name} — ปัจจุบัน ฿${baht(item.total || item.basePrice)}`}
      onClose={onClose}
      maxWidth={440}
      footer={(
        <>
          <button className="btn" style={{ background: 'var(--surf2)' }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-red" onClick={save}>✓ บันทึกราคา</button>
        </>
      )}
    >
          <div className="mf-card" style={{ padding: '.9rem 1rem' }}>
            <label className="mf-lbl">ราคาใหม่ (฿ ต่อ {item.levels?.[0]?.name || 'ลัง'})</label>
            <input type="number" style={INP} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" min="0" step="any" autoFocus />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {trendBtn('⬆️', '⬆️ ขึ้น', '#E31E24')}
              {trendBtn('⬇️', '⬇️ ลง', '#16A34A')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {supBtn('Mixue HQ', '🏢 Mixue HQ')}
              {supBtn('External Market', '🛒 ตลาดนอก')}
            </div>
            <input style={{ ...INP, marginTop: 8 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เหตุผล (ไม่บังคับ)" />
          </div>

          {hist.length > 0 && (
            <>
              <div className="mf-sec-lbl">ประวัติราคา ({hist.length})</div>
              <div className="mf-card" style={{ padding: '.6rem .8rem', maxHeight: 220, overflowY: 'auto' }}>
                {[...hist].reverse().map((h, i) => {
                  const isUp = h.trend === '⬆️'
                  const d = new Date(h.updatedAt)
                  const dateStr = isNaN(d) ? h.updatedAt : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < hist.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: isUp ? '#FEE2E2' : '#F0FDF4' }}>{h.trend || '•'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'Prompt,sans-serif' }}>฿{baht(h.price)}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{h.updatedBy || '—'} · {h.supplier || '—'} · {dateStr}</div>
                        {h.reason && h.reason !== '—' && <div style={{ fontSize: 11.5, color: 'var(--txt2)', fontStyle: 'italic' }}>"{h.reason}"</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
    </Modal>
  )
}
