import { useState, useMemo } from 'react'
import { CATS, CAT_EMOJI, CP_CATS, CP_CAT_EMOJI } from '../constants/categories'
import { num, genId, fmtDateNow } from '../utils/format'
import Modal from './Modal'

function fmtPrice(p) {
  if (!p) return '0'
  const n = p.toFixed(2)
  return parseFloat(n) >= 1000 ? parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n
}

export default function CompoundForm({ compound, library, updatedBy, onSave, onDelete, onClose }) {
  const editing = !!compound
  const [name, setName] = useState(compound?.name || '')
  const [cat, setCat] = useState(CP_CATS.includes(compound?.cat) ? compound.cat : 'Main')
  const [outputQty, setOutputQty] = useState(compound?.outputQty || '')
  const [outputUnit, setOutputUnit] = useState(compound?.outputUnit || '')
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
  const addRow = () => {
    const first = library.find((x) => x.cat === CATS[0])
    setRows((rs) => [...rs, { id: genId(), cat: CATS[0], libId: first?.id || '', qty: '' }])
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
    const outU = outputUnit.trim() || 'หน่วย'
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
                <input type="number" style={{ ...INP, width: '100%' }} value={outputQty} onChange={(e) => setOutputQty(e.target.value)} placeholder="เช่น 1000" min="0" step="any" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="mf-lbl">หน่วยผลผลิต</label>
                <input style={{ ...INP, width: '100%' }} value={outputUnit} onChange={(e) => setOutputUnit(e.target.value)} placeholder="เช่น ml, g" />
              </div>
            </div>
          </div>

          {/* วัตถุดิบ */}
          <div className="mf-sec-lbl">วัตถุดิบในสูตร</div>
          <div className="mf-card" style={{ padding: '.7rem' }}>
            {rows.map((row) => {
              const lib = library.find((x) => x.id === row.libId)
              const libItems = library.filter((x) => x.cat === row.cat)
              return (
                <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 26px', gridTemplateRows: 'auto auto', gap: 5, alignItems: 'center', background: 'var(--surf2)', borderRadius: 10, padding: '7px 8px', marginBottom: 5 }}>
                  <div style={{ gridColumn: '1/4', gridRow: 1, display: 'flex', gap: 5, minWidth: 0 }}>
                    <select value={row.cat} onChange={(e) => { const c = e.target.value; const first = library.find((x) => x.cat === c); setRow(row.id, { cat: c, libId: first?.id || '' }) }} style={{ ...INP, width: 82, flex: '0 0 82px', fontSize: 11 }}>
                      {CATS.map((c) => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                    </select>
                    <select value={row.libId} onChange={(e) => setRow(row.id, { libId: e.target.value })} style={{ ...INP, flex: 1, minWidth: 0 }}>
                      {libItems.length ? libItems.map((x) => <option key={x.id} value={x.id}>{x.name}</option>) : <option value="">— ยังไม่มี —</option>}
                    </select>
                  </div>
                  <input type="number" value={row.qty} onChange={(e) => setRow(row.id, { qty: e.target.value })} placeholder="ปริมาณ" min="0" step="any" style={{ ...INP, gridColumn: '1/2', gridRow: 2 }} />
                  <div style={{ gridColumn: 2, gridRow: 2, fontSize: 11, color: 'var(--txt2)', textAlign: 'center' }}>{lib ? lib.unit : '—'}</div>
                  <button className="btn-del" style={{ gridColumn: 3, gridRow: 2 }} onClick={() => removeRow(row.id)}>✕</button>
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
                รวม {calc.total.toFixed(2)} ฿ ÷ {calc.eff > 0 ? Math.round(calc.eff) : '?'} {outputUnit || 'หน่วย'}
                {calc.y < 100 ? ` (yield ${calc.y}%)` : ''}
              </div>
            </div>
          )}
    </Modal>
  )
}
