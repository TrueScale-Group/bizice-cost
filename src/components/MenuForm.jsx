import { useState, useMemo } from 'react'
import { CATS, CAT_EMOJI, MENU_CATS, menuEmoji } from '../constants/categories'
import { num, genId, fmtDateNow } from '../utils/format'
import { calcCost, gpColor } from '../utils/cost'

const SIZES = [
  { k: 'U', priceKey: 'priceS', label: 'แก้ว U' },
  { k: 'M', priceKey: 'priceM', label: 'แก้ว M' },
  { k: 'L', priceKey: 'priceL', label: 'แก้ว L' },
]

export default function MenuForm({ menu, library, compounds, settings, updatedBy, onSave, onDelete, onClose }) {
  const editing = !!menu
  const [name, setName] = useState(menu?.name || '')
  const [cat, setCat] = useState(menu?.cat || 'ไอศกรีม')
  const isKhanom = (cat || '').includes('ขนม')

  // ราคาต่อขนาด (U→priceS, M→priceM, L→priceL)
  const [prices, setPrices] = useState({
    U: menu?.priceS || '', M: menu?.priceM || '', L: menu?.priceL || '',
  })

  // ── สร้างสถานะเริ่มต้นของ ingredients แยกตามขนาด ──
  const initSizes = () => {
    const on = []
    if (num(menu?.priceS) > 0) on.push('U')
    if (num(menu?.priceM) > 0) on.push('M')
    if (num(menu?.priceL) > 0) on.push('L')
    ;(menu?.ingredients || []).forEach((ing) => {
      const st = ing.sizeTarget || 'all'
      if (st !== 'all' && !on.includes(st)) on.push(st)
    })
    if ((cat || '').includes('ขนม')) return ['U']
    if (!on.length) on.push('M')
    return on.sort((a, b) => 'UML'.indexOf(a) - 'UML'.indexOf(b))
  }
  const [activeSizes, setActiveSizes] = useState(initSizes)

  const initIngr = () => {
    const bySize = { U: [], M: [], L: [] }
    const on = initSizes()
    ;(menu?.ingredients || []).forEach((ing) => {
      const st = ing.sizeTarget || 'all'
      const row = { id: genId(), sourceType: ing.sourceType || 'library', sourceId: ing.sourceId || '', cat: ing.cat || 'วัตถุดิบ' }
      if (st === 'all') {
        on.forEach((sz) => {
          const q = sz === 'U' ? num(ing.qtyS) : sz === 'M' ? num(ing.qtyM) : num(ing.qtyM) * 1.25
          bySize[sz].push({ ...row, id: genId(), qty: q || '' })
        })
      } else if (bySize[st]) {
        bySize[st].push({ ...row, qty: num(ing.qty) || '' })
      }
    })
    return bySize
  }
  const [ingr, setIngr] = useState(initIngr)
  const [tab, setTab] = useState(() => initSizes()[0] || 'U')

  // ── helpers ──
  const resolve = (row) => {
    if (row.sourceType === 'compound') {
      const c = compounds.find((x) => x.id === row.sourceId)
      return c ? { name: c.name, cat: 'สูตรผสม', unit: c.outputUnit || '', price: num(c.costPerOutputUnit) } : null
    }
    const li = library.find((x) => x.id === row.sourceId)
    return li ? { name: li.name, cat: row.cat || li.cat, unit: li.unit || '', price: num(li.unitPrice) } : null
  }

  const setRow = (sz, id, patch) => setIngr((s) => ({ ...s, [sz]: s[sz].map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  const addRow = (sz) => {
    const defCat = isKhanom ? 'ขนม' : 'วัตถุดิบ'
    const firstItem = library.find((x) => x.cat === defCat)
    setIngr((s) => ({ ...s, [sz]: [...s[sz], { id: genId(), sourceType: 'library', sourceId: firstItem?.id || '', cat: defCat, qty: '' }] }))
  }
  const removeRow = (sz, id) => setIngr((s) => ({ ...s, [sz]: s[sz].filter((r) => r.id !== id) }))

  const addSize = (sz) => {
    setActiveSizes((a) => [...a, sz].sort((x, y) => 'UML'.indexOf(x) - 'UML'.indexOf(y)))
    setTab(sz)
  }
  const removeSize = (sz) => {
    setActiveSizes((a) => a.filter((x) => x !== sz))
    setPrices((p) => ({ ...p, [sz]: '' }))
    setIngr((s) => ({ ...s, [sz]: [] }))
    setTab((t) => (t === sz ? activeSizes.filter((x) => x !== sz)[0] || 'U' : t))
  }

  // เปลี่ยนหมวด → ถ้าเป็นขนม บังคับ U เดียว
  const changeCat = (v) => {
    setCat(v)
    if (v.includes('ขนม')) {
      setActiveSizes(['U'])
      setTab('U')
      setIngr((s) => ({ U: s.U, M: [], L: [] }))
    }
  }

  // ── build menu object สำหรับ preview + save ──
  const buildIngredients = () => {
    const out = []
    activeSizes.forEach((sz) => {
      ingr[sz].forEach((row) => {
        const info = resolve(row)
        if (!info || !info.name) return
        const entry = {
          cat: info.cat, name: info.name, unit: info.unit,
          pricePerUnit: info.price, sizeTarget: sz,
          sourceType: row.sourceType, sourceId: row.sourceId, qty: num(row.qty),
        }
        if (sz === 'U') entry.qtyS = num(row.qty)
        if (sz === 'M') entry.qtyM = num(row.qty)
        out.push(entry)
      })
    })
    return out
  }

  const preview = useMemo(() => {
    const ings = buildIngredients()
    return activeSizes.map((sz) => {
      const price = num(prices[sz])
      const cost = calcCost(ings, sz)
      const pct = price > 0 ? (cost / price) * 100 : 0
      return { sz, price, cost, pct }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingr, prices, activeSizes])

  const save = () => {
    if (!name.trim()) return alert('กรุณาใส่ชื่อเมนู')
    if (!activeSizes.some((sz) => num(prices[sz]) > 0)) return alert('กรุณาใส่ราคาขายอย่างน้อย 1 ขนาด')
    const ingredients = buildIngredients()
    const newMenu = {
      id: menu?.id || genId(),
      name: name.trim(), cat,
      priceS: num(prices.U), priceM: num(prices.M), priceL: num(prices.L),
      ingredients,
      updatedAt: fmtDateNow(), updatedBy,
    }
    onSave(newMenu)
  }

  const availSizes = SIZES.filter((s) => !activeSizes.includes(s.k))
  const INP = { background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: "'Sarabun',sans-serif", outline: 'none' }

  return (
    <div className="modal-overlay" style={{ display: 'block' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" id="add-menu-box" style={{ maxWidth: 520 }}>
        <div className="modal-header" style={{ padding: '.9rem 1.1rem .9rem 1.25rem' }}>
          <div>
            <div className="modal-title" style={{ fontSize: 16 }}>{editing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</div>
            <div className="modal-sub">กรอกสูตรและราคาขาย</div>
          </div>
          <button className="mh-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        <div className="mf-body">
          {/* ข้อมูลเมนู */}
          <div className="mf-sec-lbl">ข้อมูลเมนู</div>
          <div className="mf-card">
            <div className="mf-row">
              <label className="mf-lbl">ชื่อเมนู</label>
              <input className="mf-inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ซันเดย์ช็อกโกแลต" autoComplete="off" />
            </div>
            <div className="mf-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mf-lbl" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>หมวดหมู่</span>
              <select className="mf-select" value={cat} onChange={(e) => changeCat(e.target.value)}>
                {MENU_CATS.map((c) => <option key={c} value={c}>{menuEmoji(c)} {c}</option>)}
              </select>
            </div>
          </div>

          {/* ราคาขาย */}
          <div className="mf-sec-lbl">
            ราคาขาย
            {isKhanom && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#86198F', background: '#FDF4FF', border: '1px solid #F5D0FE', borderRadius: 99, padding: '1px 8px', textTransform: 'none' }}>🛒 ซื้อมาขายไป</span>}
          </div>

          {isKhanom ? (
            <div className="mf-card">
              <div className="mf-price-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.65rem 1rem' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>ราคาขาย</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <input type="number" value={prices.U} onChange={(e) => setPrices((p) => ({ ...p, U: e.target.value }))} placeholder="0" min="0" step="0.01"
                    style={{ ...INP, width: 80, textAlign: 'right', fontSize: 15, fontWeight: 700, fontFamily: "'Prompt',sans-serif" }} />
                  <span style={{ color: 'var(--txt3)' }}>฿</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeSizes.length > 0 && (
                <div className="mf-card">
                  {activeSizes.map((sz) => (
                    <div key={sz} className="mf-price-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.65rem 1rem', borderTop: sz !== activeSizes[0] ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>🥤 {SIZES.find((s) => s.k === sz).label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <input type="number" value={prices[sz]} onChange={(e) => setPrices((p) => ({ ...p, [sz]: e.target.value }))} placeholder="0" min="0" step="0.01"
                          style={{ ...INP, width: 70, textAlign: 'right', fontSize: 15, fontWeight: 700, fontFamily: "'Prompt',sans-serif" }} />
                        <span style={{ color: 'var(--txt3)' }}>฿</span>
                        <button className="btn-del" onClick={() => removeSize(sz)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {availSizes.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {availSizes.map((s) => (
                    <button key={s.k} className="btn-dashed" style={{ padding: '6px 12px', borderRadius: 99, fontWeight: 600 }} onClick={() => addSize(s.k)}>＋ {s.label}</button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* วัตถุดิบ */}
          <div className="mf-sec-lbl">วัตถุดิบ / สูตร</div>
          <div className="mf-card" style={{ padding: '.7rem' }}>
            {activeSizes.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--txt3)', textAlign: 'center', padding: '.6rem' }}>← กดปุ่มขนาดแก้วก่อน เพื่อกรอกวัตถุดิบ</div>
            ) : (
              <>
                {!isKhanom && activeSizes.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, background: 'var(--surf2)', borderRadius: 10, padding: 3, marginBottom: 8 }}>
                    {activeSizes.map((sz) => (
                      <button key={sz} onClick={() => setTab(sz)} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: 8, background: tab === sz ? '#fff' : 'transparent', fontWeight: tab === sz ? 700 : 500, fontSize: 13, cursor: 'pointer', boxShadow: tab === sz ? 'var(--sh)' : 'none' }}>
                        แก้ว {sz}
                      </button>
                    ))}
                  </div>
                )}
                {(ingr[tab] || []).map((row) => {
                  const info = resolve(row)
                  const libItems = library.filter((x) => x.cat === row.cat)
                  return (
                    <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 64px 26px', gridTemplateRows: 'auto auto', gap: 5, alignItems: 'center', background: 'var(--surf2)', borderRadius: 10, padding: '7px 8px', marginBottom: 5 }}>
                      <select value={row.sourceType} onChange={(e) => setRow(tab, row.id, { sourceType: e.target.value, sourceId: '' })} style={{ ...INP, gridColumn: 1, gridRow: 1, fontSize: 11 }}>
                        <option value="library">📦 คลัง</option>
                        <option value="compound">🧪 สูตร</option>
                      </select>
                      <div style={{ gridColumn: '2/5', gridRow: 1, display: 'flex', gap: 5, minWidth: 0 }}>
                        {row.sourceType === 'library' ? (
                          <>
                            <select value={row.cat} onChange={(e) => { const c = e.target.value; const first = library.find((x) => x.cat === c); setRow(tab, row.id, { cat: c, sourceId: first?.id || '' }) }} style={{ ...INP, width: 78, flex: '0 0 78px', fontSize: 11 }}>
                              {CATS.map((c) => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                            </select>
                            <select value={row.sourceId} onChange={(e) => setRow(tab, row.id, { sourceId: e.target.value })} style={{ ...INP, flex: 1, minWidth: 0 }}>
                              {libItems.length ? libItems.map((x) => <option key={x.id} value={x.id}>{x.name}</option>) : <option value="">— ยังไม่มี —</option>}
                            </select>
                          </>
                        ) : (
                          <select value={row.sourceId} onChange={(e) => setRow(tab, row.id, { sourceId: e.target.value })} style={{ ...INP, flex: 1, minWidth: 0 }}>
                            {compounds.length ? compounds.map((c) => <option key={c.id} value={c.id}>{c.name}</option>) : <option value="">— ยังไม่มีสูตร —</option>}
                          </select>
                        )}
                      </div>
                      <input type="number" value={row.qty} onChange={(e) => setRow(tab, row.id, { qty: e.target.value })} placeholder="ปริมาณ" min="0" step="any" style={{ ...INP, gridColumn: '1/3', gridRow: 2 }} />
                      <div style={{ gridColumn: 3, gridRow: 2, fontSize: 11, color: 'var(--txt2)', textAlign: 'center', overflow: 'hidden' }}>
                        {info ? `${info.unit}` : '—'}
                      </div>
                      <button className="btn-del" style={{ gridColumn: 4, gridRow: 2 }} onClick={() => removeRow(tab, row.id)}>✕</button>
                    </div>
                  )
                })}
                <button className="btn-dashed" style={{ width: '100%', marginTop: 4 }} onClick={() => addRow(tab)}>＋ {isKhanom ? 'เพิ่มขนม' : 'เพิ่มวัตถุดิบ ' + tab}</button>
              </>
            )}
          </div>

          {/* Preview */}
          {preview.some((p) => p.price > 0) && (
            <>
              <div className="mf-sec-lbl">สรุปต้นทุน</div>
              <div className="mf-card" style={{ padding: '.6rem .8rem' }}>
                {preview.filter((p) => p.price > 0).map((p) => (
                  <div key={p.sz} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                    <span>แก้ว {p.sz} · ต้นทุน {p.cost.toFixed(2)}฿ / ขาย {p.price}฿</span>
                    <strong style={{ color: gpColor(p.pct, settings) }}>{p.pct.toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '.85rem 1.1rem' }}>
          {editing && onDelete && (
            <button className="btn" style={{ background: 'var(--red-p)', color: 'var(--red)', marginRight: 'auto' }} onClick={() => onDelete(menu)}>🗑️ ลบเมนู</button>
          )}
          <button className="btn" style={{ background: 'var(--surf2)' }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-red" onClick={save}>✓ บันทึกเมนู</button>
        </div>
      </div>
    </div>
  )
}
