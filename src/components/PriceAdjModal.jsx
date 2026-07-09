import { useState } from 'react'
import { num, fmtDateNow, baht, fmtQtyInput, parseQtyInput } from '../utils/format'
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
            <input type="text" inputMode="decimal" style={INP} value={fmtQtyInput(price)}
              onChange={(e) => { const v = parseQtyInput(e.target.value); if (v !== null) setPrice(v) }}
              placeholder="0" autoFocus />
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
                {hist.map((h, i) => ({ ...h, fromPrice: i > 0 ? num(hist[i - 1].price) : null }))
                  .reverse()
                  .map((h, i, arr) => {
                    const from = h.fromPrice
                    const to = num(h.price)
                    const hasFrom = from != null && from > 0
                    const diff = hasFrom ? to - from : 0
                    const pct = hasFrom ? (diff / from) * 100 : 0
                    const isUp = diff > 0, isDown = diff < 0
                    // ราคาวัตถุดิบขึ้น = ต้นทุนสูงขึ้น (แดง) · ราคาลง = ต้นทุนลดลง (เขียว) — ธีมเดียวกับ cost ratio ทั่วแอพ
                    const dirColor = !hasFrom ? 'var(--txt3)' : isUp ? '#DC2626' : isDown ? '#16A34A' : 'var(--txt3)'
                    const dirIcon = !hasFrom ? '•' : isUp ? '⬆️' : isDown ? '⬇️' : '➖'
                    const d = new Date(h.updatedAt)
                    const dateStr = isNaN(d) ? h.updatedAt : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                    return (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: !hasFrom ? 'var(--surf2)' : isUp ? '#FEE2E2' : '#F0FDF4' }}>{dirIcon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {hasFrom ? (
                            <div style={{ fontSize: 13, fontFamily: 'Prompt,sans-serif', display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                              <span style={{ color: 'var(--txt3)', fontWeight: 500, textDecoration: 'line-through' }}>฿{baht(from)}</span>
                              <span style={{ color: 'var(--txt3)' }}>→</span>
                              <span style={{ fontWeight: 700, color: dirColor }}>฿{baht(to)}</span>
                              <span style={{ fontWeight: 700, color: dirColor, fontSize: 12 }}>({isUp ? '+' : ''}{pct.toFixed(1)}%)</span>
                            </div>
                          ) : (
                            <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'Prompt,sans-serif', color: 'var(--txt2)' }}>เริ่มต้นที่ ฿{baht(to)}</div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{h.updatedBy || '—'} · {h.supplier || '—'} · {dateStr}</div>
                          {h.reason && h.reason !== '—' && <div style={{ fontSize: 11.5, color: 'var(--txt2)', fontStyle: 'italic', marginTop: 1 }}>"{h.reason}"</div>}
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
