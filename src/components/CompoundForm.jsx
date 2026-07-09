import { useState, useMemo } from 'react'
import { CATS, CAT_EMOJI, CP_CATS, CP_CAT_EMOJI } from '../constants/categories'
import { num, genId, fmtDateNow } from '../utils/format'
import { itemEmoji } from '../utils/sortItems'
import Modal from './Modal'

function fmtPrice(p) {
  if (!p) return '0'
  const n = p.toFixed(2)
  return parseFloat(n) >= 1000 ? parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n
}

// หน่วยผลผลิตมาตรฐาน — เลือกได้แค่ กรัม/มล. (ของเก่าที่หลากหลาย เช่น "ml","g" ให้ normalize เข้าค่าใดค่าหนึ่ง)
const OUTPUT_UNITS = ['กรัม', 'มล.']
function normalizeOutputUnit(u) {
  const s = String(u || '').toLowerCase()
  return (s.includes('มล') || s.includes('ml') || s.includes('cc') || s.includes('ซีซี')) ? 'มล.' : 'กรัม'
}
// แสดงตัวเลขมี comma คั่นหลักพันระหว่างพิมพ์ — เก็บ state เป็นสตริงดิบไว้คำนวณ ไม่ใช่ค่าที่ format แล้ว
function fmtQtyInput(raw) {
  if (raw === '' || raw == null) return ''
  if (/\.$/.test(String(raw))) return raw // กำลังพิมพ์จุดทศนิยมค้างอยู่ ยังไม่แปลง กันค่าเพี้ยน
  const n = Number(raw)
  return isNaN(n) ? raw : n.toLocaleString('th-TH', { maximumFractionDigits: 6 })
}
function parseQtyInput(str) {
  const raw = String(str).replace(/,/g, '')
  return /^\d*\.?\d*$/.test(raw) ? raw : null
}

export default function CompoundForm({ compound, library, masterByName, updatedBy, onSave, onDelete, onClose }) {
  const editing = !!compound
  const [name, setName] = useState(compound?.name || '')
  const [cat, setCat] = useState(CP_CATS.includes(compound?.cat) ? compound.cat : 'Main')
  const [outputQty, setOutputQty] = useState(compound?.outputQty || '')
  const [outputUnit, setOutputUnit] = useState(() => normalizeOutputUnit(compound?.outputUnit))
  const [yieldPct, setYieldPct] = useState(compound?.yield || 100)
  const [sop, setSop] = useState(compound?.sop || '')
  const [advOpen, setAdvOpen] = useState(!!(compound?.sop || compound?.servingUnit || (compound?.yield && compound.yield !== 100)))
  const [serveEnabled, setServeEnabled] = useState(!!compound?.servingUnit)
  const [serveName, setServeName] = useState(compound?.servingUnit?.name || '')
  const [serveQty, setServeQty] = useState(compound?.servingUnit?.qty || '')

  const initRows = () => {
    const rows = (compound?.ingredients || []).map((ing) => {
      const lib = library.find((x) => x.id === ing.sourceId) || library.find((x) => x.id === ing.libId) || library.find((x) => x.name === ing.name)
      return { id: genId(), cat: lib?.cat || ing.cat || CATS[0], libId: lib?.id || '', qty: num(ing.qty) || '' }
    })
    if (!rows.length) {
      const first = library.find((x) => x.cat === CATS[0])
      rows.push({ id: genId(), cat: CATS[0], libId: first?.id || '', qty: '' })
    }
    return rows
  }
  const [rows, setRows] = useState(initRows)

  const setRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  // แถวที่กำลังแก้อยู่ (accordion — เห็น dropdown เต็มทีละรายการ) ที่เหลือย่อเป็นบรรทัดเดียวดูอย่างเดียว
  const [editRowId, setEditRowId] = useState(null)
  const addRow = () => {
    const first = library.find((x) => x.cat === CATS[0])
    const newId = genId()
    setRows((rs) => [...rs, { id: newId, cat: CATS[0], libId: first?.id || '', qty: '' }])
    setEditRowId(newId)
  }
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id))

  const calc = useMemo(() => {
    const oq = num(outputQty)
    const y = Math.min(100, Math.max(0.01, num(yieldPct) || 100))
    let total = 0
    rows.forEach((r) => {
      const lib = library.find((x) => x.id === r.libId)
      total += num(r.qty) * (lib ? num(lib.unitPrice) : 0)
    })
    const eff = oq * (y / 100)
    const cpo = eff > 0 ? total / eff : 0
    return { total, eff, cpo, y }
  }, [rows, outputQty, yieldPct, library])

  const save = () => {
    const nm = name.trim()
    if (!nm) return alert('กรุณาใส่ชื่อสูตรผสม')
    if (!num(outputQty)) return alert('กรุณาใส่ปริมาณที่ได้ (เช่น 1000)')
    const valid = rows
      .map((r) => {
        const lib = library.find((x) => x.id === r.libId)
        if (!lib || num(r.qty) <= 0) return null
        return { name: lib.name, qty: num(r.qty), unit: lib.unit, unitPrice: num(lib.unitPrice), sourceId: lib.id, sourceType: 'library', libId: lib.id, cat: lib.cat }
      })
      .filter(Boolean)
    if (!valid.length) return alert('กรุณาใส่ปริมาณวัตถุดิบอย่างน้อย 1 อย่าง')
    const outU = outputUnit
    const servingUnit = serveEnabled && num(serveQty) > 0
      ? { name: serveName.trim() || 'ตัก', qty: num(serveQty), costPerServe: calc.cpo * num(serveQty) }
      : null
    // spread existing ก่อน → รักษา sortOrder + field อื่นที่ Inventory อ่าน
    const c = {
      ...(compound || {}),
      id: compound?.id || genId(),
      name: nm, cat, outputQty: num(outputQty), outputUnit: outU,
      yield: calc.y, sop: sop.trim() || '',
      servingUnit,
      ingredients: valid,
      costPerOutputUnit: calc.cpo,
      updatedAt: fmtDateNow(), updatedBy,
    }
    onSave(c)
  }

  const INP = { background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: "'Sarabun',sans-serif", outline: 'none' }

  return (
    <Modal
      title={editing ? 'แก้ไขสูตรผสม' : 'เพิ่มสูตรผสม'}
      subtitle="รวมวัตถุดิบ → ต้นทุนต่อหน่วยผลผลิต"
      onClose={onClose}
      maxWidth={520}
      footer={(
        <>
          {editing && onDelete && (
            <button className="btn" style={{ background: 'var(--red-p)', color: 'var(--red)', marginRight: 'auto' }} onClick={() => onDelete(compound)}>🗑️ ลบสูตร</button>
          )}
          <button className="btn" style={{ background: 'var(--surf2)' }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-red" onClick={save}>✓ บันทึกสูตร</button>
        </>
      )}
    >
          {/* ข้อมูล */}
          <div className="mf-sec-lbl">ข้อมูลสูตร</div>
          <div className="mf-card">
            <div className="mf-row">
              <label className="mf-lbl">ชื่อสูตรผสม</label>
              <input className="mf-inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ชาเขียวเข้มข้น, ซอสสตรอว์เบอร์รี" autoComplete="off" />
            </div>
            <div className="mf-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mf-lbl" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>หมวดหมู่</span>
              <select className="mf-select" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CP_CATS.map((c) => <option key={c} value={c}>{CP_CAT_EMOJI[c]} {c}</option>)}
              </select>
            </div>
            <div className="mf-row" style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="mf-lbl">ปริมาณที่ได้</label>
                <input type="text" inputMode="decimal" style={{ ...INP, width: '100%' }} value={fmtQtyInput(outputQty)}
                  onChange={(e) => { const v = parseQtyInput(e.target.value); if (v !== null) setOutputQty(v) }}
                  placeholder="เช่น 1,000" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="mf-lbl">หน่วยผลผลิต</label>
                <select style={{ ...INP, width: '100%' }} value={outputUnit} onChange={(e) => setOutputUnit(e.target.value)}>
                  {OUTPUT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* วัตถุดิบ */}
          <div className="mf-sec-lbl">วัตถุดิบในสูตร</div>
          <div className="mf-card" style={{ padding: '.7rem' }}>
            {rows.map((row) => {
              const lib = library.find((x) => x.id === row.libId)
              const libItems = library.filter((x) => x.cat === row.cat)

              // ── ย่อ: บรรทัดเดียวดูอย่างเดียว — คลิก ✏️ เพื่อแก้รายการนั้น ──
              if (editRowId !== row.id) {
                return (
                  <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surf2)', borderRadius: 10, padding: '8px 10px', marginBottom: 6 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{itemEmoji(lib?.name, masterByName)}</span>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: lib ? 'var(--txt)' : 'var(--txt3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lib ? lib.name : '— ยังไม่เลือกรายการ —'}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt2)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {num(row.qty).toLocaleString('th-TH')}{lib ? ` ${lib.unit}` : ''}
                    </div>
                    <button type="button" className="btn-view" style={{ flexShrink: 0 }} onClick={() => setEditRowId(row.id)}>✏️</button>
                  </div>
                )
              }

              // ── ขยาย: แก้รายการนี้ (dropdown ครบ) ──
              return (
                <div key={row.id} style={{ display: 'flex', flexDirection: 'column', gap: 7, background: 'var(--surf2)', borderRadius: 10, padding: '9px 10px', marginBottom: 6, border: '1.5px solid var(--red)' }}>
                  {/* แถว 1: หมวด + เลือกวัตถุดิบ + เสร็จ + ลบ — minWidth ต่อช่อง ป้องกันบีบจนอ่านไม่ออก (สกรอลแนวนอนแทนถ้าจอแคบมาก, ปุ่มตรึงไว้เสมอ) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, minWidth: 0 }}>
                      <select value={row.cat} onChange={(e) => { const c = e.target.value; const first = library.find((x) => x.cat === c); setRow(row.id, { cat: c, libId: first?.id || '' }) }} style={{ ...INP, flex: '0 0 110px', width: 110, minWidth: 110, fontSize: 12.5 }}>
                        {CATS.map((c) => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                      </select>
                      <select value={row.libId} onChange={(e) => setRow(row.id, { libId: e.target.value })} style={{ ...INP, flex: '1 0 150px', minWidth: 150, fontSize: 12.5 }}>
                        {libItems.length ? libItems.map((x) => <option key={x.id} value={x.id}>{x.name}</option>) : <option value="">— ยังไม่มี —</option>}
                      </select>
                    </div>
                    <button type="button" className="btn-view" style={{ flexShrink: 0, color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => setEditRowId(null)}>✓ เสร็จ</button>
                    <button className="btn-del" style={{ flexShrink: 0 }} onClick={() => removeRow(row.id)}>✕</button>
                  </div>
                  {/* แถว 2: ปริมาณ + หน่วย */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" value={row.qty} onChange={(e) => setRow(row.id, { qty: e.target.value })} placeholder="ปริมาณ" min="0" step="any" style={{ ...INP, flex: 1, minWidth: 70 }} />
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt2)', minWidth: 44, textAlign: 'center', flexShrink: 0 }}>{lib ? lib.unit : '—'}</div>
                  </div>
                </div>
              )
            })}
            <button className="btn-dashed" style={{ width: '100%', marginTop: 4 }} onClick={addRow}>＋ เพิ่มวัตถุดิบ</button>
          </div>

          {/* Advanced */}
          <button className="mf-sec-lbl" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', justifyContent: 'space-between' }} onClick={() => setAdvOpen((o) => !o)}>
            <span>ขั้นสูง — yield / หน่วยตัก / วิธีทำ</span>
            <span>{advOpen ? '▲' : '▼'}</span>
          </button>
          {advOpen && (
            <div className="mf-card">
              <div className="mf-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mf-lbl" style={{ marginBottom: 0 }}>Yield (%)</span>
                <input type="number" style={{ ...INP, width: 80 }} value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} min="1" max="100" step="any" />
                <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{num(yieldPct) < 100 ? `สูญเสีย ${(100 - num(yieldPct)).toFixed(0)}%` : 'ไม่มีการสูญเสีย'}</span>
              </div>
              <div className="mf-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={serveEnabled} onChange={(e) => setServeEnabled(e.target.checked)} />
                  หน่วยตัก/เสิร์ฟ
                </label>
                {serveEnabled && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <input style={{ ...INP, flex: 1 }} value={serveName} onChange={(e) => setServeName(e.target.value)} placeholder="ชื่อ เช่น ตัก" />
                    <input type="number" style={{ ...INP, flex: 1 }} value={serveQty} onChange={(e) => setServeQty(e.target.value)} placeholder={`กี่ ${outputUnit || 'หน่วย'}`} min="0" step="any" />
                  </div>
                )}
              </div>
              <div className="mf-row">
                <label className="mf-lbl">วิธีทำ (SOP)</label>
                <textarea value={sop} onChange={(e) => setSop(e.target.value)} placeholder="ขั้นตอนการทำ (ไม่บังคับ)" rows={2} style={{ ...INP, width: '100%', resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* Preview */}
          {num(outputQty) > 0 && (
            <div className="mf-card" style={{ padding: '.7rem .9rem', background: 'var(--purple-bg)', border: '1px solid var(--purple-b)' }}>
              <div style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 700 }}>
                🧪 ต้นทุน <strong style={{ fontFamily: 'Prompt,sans-serif' }}>{fmtPrice(calc.cpo)} ฿/{outputUnit || 'หน่วย'}</strong>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>
                รวม {calc.total.toFixed(2)} ฿ ÷ {calc.eff > 0 ? Math.round(calc.eff).toLocaleString('th-TH') : '?'} {outputUnit || 'หน่วย'}
                {calc.y < 100 ? ` (yield ${calc.y}%)` : ''}
              </div>
            </div>
          )}
    </Modal>
  )
}
