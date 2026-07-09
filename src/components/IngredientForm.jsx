import { useState, useMemo } from 'react'
import { CATS, CAT_EMOJI, LIB_SUGGESTIONS } from '../constants/categories'
import { num, fmtDateNow, genId } from '../utils/format'
import Modal from './Modal'

// ราคาต่อหน่วย (ตาม vanilla): (base+freight)×(1+waste/100) / divisor
function fmtPrice(p) {
  if (!p) return '0'
  const n = p.toFixed(2)
  return parseFloat(n) >= 1000 ? parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n
}

export default function IngredientForm({ item, library, updatedBy, onSave, onDelete, onClose }) {
  const editing = !!item
  const [name, setName] = useState(item?.name || '')
  const [cat, setCat] = useState(item?.cat || 'แยม')
  const [base, setBase] = useState(item ? (item.total || item.basePrice || '') : '')
  const [baseUnit, setBaseUnit] = useState(item?.levels?.[0]?.name || item?.unit || '')
  // sub-levels = levels[1..]
  const [levels, setLevels] = useState(item?.levels?.slice(1).map((l) => ({ name: l.name || '', qty: l.qty || 1 })) || [])
  const [advOpen, setAdvOpen] = useState(!!(item?.freight || item?.waste || item?.servingUnit))
  const [freight, setFreight] = useState(item?.freight || '')
  const [waste, setWaste] = useState(item?.waste || '')
  const [serveEnabled, setServeEnabled] = useState(!!item?.servingUnit)
  const [serveName, setServeName] = useState(item?.servingUnit?.name || '')
  const [serveQty, setServeQty] = useState(item?.servingUnit?.qty || '')

  const calc = useMemo(() => {
    const b = num(base), fr = num(freight), w = num(waste)
    let divisor = 1
    levels.forEach((lv) => { divisor *= (num(lv.qty) > 0 ? num(lv.qty) : 1) })
    const effectiveBase = (b + fr) * (1 + w / 100)
    const unitPrice = divisor > 0 ? effectiveBase / divisor : 0
    const finalUnit = levels.length ? (levels[levels.length - 1].name || baseUnit) : baseUnit
    // per-level cumulative price
    let d = 1
    const levelPrices = levels.map((lv) => {
      d *= (num(lv.qty) > 0 ? num(lv.qty) : 1)
      return b > 0 ? effectiveBase / d : 0
    })
    return { divisor, unitPrice, finalUnit, levelPrices }
  }, [base, freight, waste, levels, baseUnit])

  const setLevel = (idx, patch) => setLevels((ls) => ls.map((l, i) => i === idx ? { ...l, ...patch } : l))
  const addLevel = () => { if (levels.length < 5) setLevels((ls) => [...ls, { name: '', qty: 1 }]) }
  const removeLevel = (idx) => setLevels((ls) => ls.filter((_, i) => i !== idx))

  const save = () => {
    const nm = name.trim()
    if (!nm) return alert('กรุณาใส่ชื่อวัตถุดิบ')
    if (!num(base)) return alert('กรุณาใส่ราคาซื้อ')
    if (!baseUnit.trim()) return alert('กรุณาใส่ชื่อหน่วยที่ซื้อ')
    if (levels.some((l) => l.qty !== '' && num(l.qty) <= 0)) return alert('จำนวนหน่วยย่อยต้องมากกว่า 0')
    // เตือนชื่อซ้ำ
    if (library.some((x) => x.id !== item?.id && (x.name || '').trim().toLowerCase() === nm.toLowerCase())) {
      if (!confirm(`มีวัตถุดิบชื่อ "${nm}" อยู่แล้ว\nบันทึกซ้ำหรือไม่?`)) return
    }
    const b = num(base), fr = num(freight), w = num(waste)
    const outLevels = [{ name: baseUnit.trim(), qty: 1 }, ...levels.map((l) => ({ name: l.name, qty: num(l.qty) > 0 ? num(l.qty) : 1 }))]
    const servingUnit = serveEnabled ? {
      name: serveName.trim() || 'ตัก',
      qty: num(serveQty),
      costPerServe: calc.unitPrice * num(serveQty),
    } : null
    const newItem = {
      id: item?.id || genId(),
      name: nm, cat,
      basePrice: b, total: b, qty: calc.divisor,
      unit: calc.finalUnit, unitPrice: calc.unitPrice,
      levels: outLevels,
      freight: fr || 0, waste: w || 0,
      servingUnit,
      pinned: item?.pinned || false,
      priceHistory: item?.priceHistory || [],
      updatedAt: fmtDateNow(), updatedBy,
    }
    onSave(newItem)
  }

  const INP = { width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 9px', fontSize: 14, fontFamily: "'Sarabun',sans-serif", outline: 'none' }

  return (
    <Modal
      title={editing ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบ'}
      subtitle="ราคาซื้อ → คำนวณต้นทุนต่อหน่วยอัตโนมัติ"
      onClose={onClose}
      maxWidth={500}
      footer={(
        <>
          {editing && onDelete && (
            <button className="btn" style={{ background: 'var(--red-p)', color: 'var(--red)', marginRight: 'auto' }} onClick={() => onDelete(item)}>🗑️ ลบวัตถุดิบ</button>
          )}
          <button className="btn" style={{ background: 'var(--surf2)' }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-red" onClick={save}>✓ บันทึก</button>
        </>
      )}
    >
          {/* ข้อมูล */}
          <div className="mf-sec-lbl">ข้อมูล</div>
          <div className="mf-card">
            <div className="mf-row">
              <label className="mf-lbl">ชื่อวัตถุดิบ</label>
              <input className="mf-inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={LIB_SUGGESTIONS[cat] || 'ชื่อวัตถุดิบ'} autoComplete="off" />
            </div>
            <div className="mf-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mf-lbl" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>หมวดหมู่</span>
              <select className="mf-select" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATS.map((c) => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
              </select>
            </div>
          </div>

          {/* ราคาซื้อ */}
          <div className="mf-sec-lbl">ราคาซื้อ</div>
          <div className="mf-card">
            <div className="mf-row" style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="mf-lbl">ราคาที่ซื้อ (฿)</label>
                <input type="number" style={INP} value={base} onChange={(e) => setBase(e.target.value)} placeholder="0" min="0" step="any" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="mf-lbl">หน่วยที่ซื้อ (ชั้นแรก)</label>
                <input style={INP} value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} placeholder="เช่น ลัง, กล่อง" />
              </div>
            </div>
          </div>

          {/* หน่วยย่อย */}
          <div className="mf-sec-lbl">หน่วยย่อย (สูงสุด 5 ขั้น)</div>
          <div className="mf-card" style={{ padding: '.6rem .7rem' }}>
            {levels.length === 0 && <div style={{ fontSize: 12, color: 'var(--txt3)', padding: '2px 4px 8px' }}>ถ้าซื้อเป็นลังแล้วใช้เป็นกรัม/มล. กด "＋ เพิ่มหน่วยย่อย"</div>}
            {levels.map((lv, idx) => {
              const prevUnit = idx === 0 ? (baseUnit || '?') : (levels[idx - 1].name || '?')
              const lvPrice = calc.levelPrices[idx] || 0
              return (
                <div key={idx} style={{ background: 'var(--surf2)', borderRadius: 10, padding: '8px 9px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input placeholder="ชื่อหน่วย เช่น กระป๋อง, กรัม" value={lv.name} onChange={(e) => setLevel(idx, { name: e.target.value })} style={{ ...INP, flex: 1 }} />
                    <button className="btn-del" onClick={() => removeLevel(idx)}>✕</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>1 {prevUnit} =</span>
                    <input type="number" placeholder="จำนวน" value={lv.qty} onChange={(e) => setLevel(idx, { qty: e.target.value })} min="0.0001" step="any" style={{ ...INP, width: 84, fontSize: 13 }} />
                    <div style={{ flex: 1 }} />
                    {lvPrice > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-b)', borderRadius: 8, padding: '4px 8px', whiteSpace: 'nowrap' }}>
                        {fmtPrice(lvPrice)} ฿/{lv.name || '?'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {levels.length < 5 && (
              <button className="btn-dashed" style={{ width: '100%', marginTop: 2 }} onClick={addLevel}>＋ เพิ่มหน่วยย่อย</button>
            )}
          </div>

          {/* Advanced */}
          <button className="mf-sec-lbl" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', justifyContent: 'space-between' }} onClick={() => setAdvOpen((o) => !o)}>
            <span>ขั้นสูง — ค่าขนส่ง / waste / หน่วยตัก</span>
            <span>{advOpen ? '▲' : '▼'}</span>
          </button>
          {advOpen && (
            <div className="mf-card">
              <div className="mf-row" style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="mf-lbl">💰 ค่าขนส่ง (฿/Case)</label>
                  <input type="number" style={INP} value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="เช่น 50" min="0" step="any" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="mf-lbl">💧 Waste Buffer (%)</label>
                  <input type="number" style={INP} value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="เช่น 5" min="0" step="any" />
                </div>
              </div>
              <div className="mf-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={serveEnabled} onChange={(e) => setServeEnabled(e.target.checked)} />
                  🥄 เปิดใช้งานหน่วยตัก/ปั๊ม (สำหรับหน้าร้าน)
                </label>
                {serveEnabled && (
                  <>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label className="mf-lbl">ชื่อหน่วย เช่น ตัก, ปั๊ม, ช้อน</label>
                        <input style={{ ...INP, width: '100%' }} value={serveName} onChange={(e) => setServeName(e.target.value)} placeholder="ตัก" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="mf-lbl">1 {serveName.trim() || 'หน่วยตัก'} = {calc.finalUnit || 'หน่วย'}</label>
                        <input type="number" style={{ ...INP, width: '100%' }} value={serveQty} onChange={(e) => setServeQty(e.target.value)} placeholder="25" min="0" step="any" />
                      </div>
                    </div>
                    {num(serveQty) > 0 && num(base) > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--purple)', background: 'var(--purple-bg)', border: '1px solid var(--purple-b)', borderRadius: 8, padding: '6px 10px' }}>
                        🥄 1 {serveName.trim() || 'ตัก'} ({num(serveQty)} {calc.finalUnit}) = {fmtPrice(calc.unitPrice * num(serveQty))} ฿
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preview — ราคาสุดท้าย */}
          {num(base) > 0 && (
            <div className="mf-card" style={{ padding: '.7rem .9rem', background: 'var(--green-bg)', border: '1px solid var(--green-b)' }}>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                💡 ราคาสุดท้าย: <strong style={{ fontFamily: 'Prompt,sans-serif' }}>{fmtPrice(calc.unitPrice)} ฿/{calc.finalUnit || '?'}</strong>
                {num(freight) > 0 && ` · +ขนส่ง ${num(freight).toLocaleString('th-TH')}฿`}
                {num(waste) > 0 && ` · +waste ${num(waste)}%`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>ใช้หน่วยนี้ในสูตรเมนู/สูตรผสม</div>
            </div>
          )}
    </Modal>
  )
}
