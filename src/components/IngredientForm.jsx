import { useState, useMemo } from 'react'
import { CATS, CAT_EMOJI, LIB_SUGGESTIONS } from '../constants/categories'
import { num, fmtDateNow, genId } from '../utils/format'

// ราคาต่อหน่วย (ตาม vanilla): (base+freight)×(1+waste/100) / divisor
function fmtPrice(p) {
  if (!p) return '0'
  const n = p.toFixed(2)
  return parseFloat(n) >= 1000 ? parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n
}

export default function IngredientForm({ item, library, updatedBy, onSave, onClose }) {
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
    <div className="modal-overlay" style={{ display: 'block' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-header" style={{ padding: '.9rem 1.1rem .9rem 1.25rem' }}>
          <div>
            <div className="modal-title" style={{ fontSize: 16 }}>{editing ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบ'}</div>
            <div className="modal-sub">ราคาซื้อ → คำนวณต้นทุนต่อหน่วยอัตโนมัติ</div>
          </div>
          <button className="mh-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        <div className="mf-body">
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
                <label className="mf-lbl">หน่วยที่ซื้อ</label>
                <input style={INP} value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} placeholder="เช่น ลัง, กล่อง" />
              </div>
            </div>
          </div>

          {/* หน่วยย่อย */}
          <div className="mf-sec-lbl">แตกหน่วยย่อย (ไม่บังคับ)</div>
          <div className="mf-card" style={{ padding: '.6rem .7rem' }}>
            {levels.length === 0 && <div style={{ fontSize: 12, color: 'var(--txt3)', padding: '2px 4px 8px' }}>ถ้าซื้อเป็นลังแล้วใช้เป็นกรัม/มล. กด "＋ แตกหน่วย"</div>}
            {levels.map((lv, idx) => {
              const prevUnit = idx === 0 ? (baseUnit || '?') : (levels[idx - 1].name || '?')
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto 30px', gap: 6, alignItems: 'center', background: 'var(--surf2)', borderRadius: 10, padding: '7px 8px', marginBottom: 5 }}>
                  <input placeholder="ชื่อหน่วย เช่น g, ml" value={lv.name} onChange={(e) => setLevel(idx, { name: e.target.value })} style={{ ...INP, fontSize: 13 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>1 {prevUnit} =</span>
                    <input type="number" placeholder="จำนวน" value={lv.qty} onChange={(e) => setLevel(idx, { qty: e.target.value })} min="0.0001" step="any" style={{ ...INP, width: 72, fontSize: 13 }} />
                  </div>
                  <button className="btn-del" onClick={() => removeLevel(idx)}>✕</button>
                </div>
              )
            })}
            {levels.length < 5 && (
              <button className="btn-dashed" style={{ width: '100%', marginTop: 2 }} onClick={addLevel}>＋ แตกหน่วยย่อย</button>
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
                  <label className="mf-lbl">ค่าขนส่ง (฿/ลัง)</label>
                  <input type="number" style={INP} value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="0" min="0" step="any" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="mf-lbl">Waste (%)</label>
                  <input type="number" style={INP} value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="0" min="0" step="any" />
                </div>
              </div>
              <div className="mf-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={serveEnabled} onChange={(e) => setServeEnabled(e.target.checked)} />
                  หน่วยตัก/เสิร์ฟ (แปลงต้นทุนต่อครั้ง)
                </label>
                {serveEnabled && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <input style={{ ...INP, flex: 1 }} value={serveName} onChange={(e) => setServeName(e.target.value)} placeholder="ชื่อ เช่น ตัก, ช้อน" />
                    <input type="number" style={{ ...INP, flex: 1 }} value={serveQty} onChange={(e) => setServeQty(e.target.value)} placeholder={`กี่ ${calc.finalUnit || 'หน่วย'}`} min="0" step="any" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {num(base) > 0 && (
            <div className="mf-card" style={{ padding: '.7rem .9rem', background: 'var(--green-bg)', border: '1px solid var(--green-b)' }}>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                💡 ต้นทุน <strong style={{ fontFamily: 'Prompt,sans-serif' }}>{fmtPrice(calc.unitPrice)} ฿/{calc.finalUnit || '?'}</strong>
                {num(freight) > 0 && ` · +ขนส่ง ${num(freight)}฿`}
                {num(waste) > 0 && ` · +waste ${num(waste)}%`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>ใช้หน่วยนี้ในสูตรเมนู/สูตรผสม</div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '.85rem 1.1rem' }}>
          <button className="btn" style={{ background: 'var(--surf2)' }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-red" onClick={save}>✓ บันทึก</button>
        </div>
      </div>
    </div>
  )
}
