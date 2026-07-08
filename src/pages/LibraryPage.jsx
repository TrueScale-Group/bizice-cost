import { useState, useMemo } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'
import { CATS, CAT_EMOJI, CAT_COLOR } from '../constants/categories'
import { num, baht, fmtDate } from '../utils/format'
import { recalcAll, libUsage } from '../utils/cost'
import { useInventoryMaster } from '../hooks/useInventoryMaster'
import { itemEmoji, sortLibraryByMaster, catGroupOrder } from '../utils/sortItems'
import IngredientForm from '../components/IngredientForm'
import PriceAdjModal from '../components/PriceAdjModal'
import BreakdownModal from '../components/BreakdownModal'
import CycleFilter from '../components/CycleFilter'

export default function LibraryPage() {
  const { library, menus, compounds, commit, session } = useCost()
  const toast = useToast()
  const { byName: masterByName, catOrder } = useInventoryMaster()
  const [cat, setCat] = useState('all')
  const [form, setForm] = useState(null) // {item} | {item:null} for new | null closed
  const [priceAdj, setPriceAdj] = useState(null) // item | null
  const [showBd, setShowBd] = useState(false)

  // เรียง + จัดกลุ่มตาม Master Data ของ Inventory (emoji ต่อชิ้น + ลำดับตรงกับ Inventory)
  const groups = useMemo(() => {
    const list = cat === 'all' ? library : library.filter((i) => (i.cat || 'อื่นๆ') === cat)
    const sorted = sortLibraryByMaster(list, masterByName, catOrder)
    const by = {}
    sorted.forEach((i) => { (by[i.cat || 'อื่นๆ'] ||= []).push(i) })
    const order = catGroupOrder(catOrder)
    const known = order.filter((c) => by[c]).map((c) => ({ cat: c, items: by[c] }))
    const extra = Object.keys(by).filter((c) => !order.includes(c)).map((c) => ({ cat: c, items: by[c] }))
    return [...known, ...extra]
  }, [library, cat, masterByName, catOrder])

  // เพิ่ม/แก้ไข → รวมเข้า library แล้ว cascade cost เข้า compounds+menus
  const saveIngredient = (item) => {
    const exists = library.some((x) => x.id === item.id)
    const nextLib = exists ? library.map((x) => (x.id === item.id ? item : x)) : [...library, item]
    const { compounds: nc, menus: nm } = recalcAll(nextLib, compounds, menus)
    commit({ library: nextLib, compounds: nc, menus: nm })
    setForm(null)
    toast('บันทึกวัตถุดิบแล้ว', '✅')
  }

  // ปรับราคา (จาก PriceAdjModal — item ที่อัปเดต priceHistory+ราคาแล้ว)
  const savePriceAdj = (item) => {
    const nextLib = library.map((x) => (x.id === item.id ? item : x))
    const { compounds: nc, menus: nm } = recalcAll(nextLib, compounds, menus)
    commit({ library: nextLib, compounds: nc, menus: nm })
    setPriceAdj(null)
    toast(`อัปเดตราคา ${item.name} แล้ว`, '🔄')
  }

  const deleteIngredient = (item) => {
    const u = libUsage(item.id, menus, compounds)
    let msg = `ลบ "${item.name}"?`
    if (u.total > 0) {
      const parts = []
      if (u.m) parts.push(`${u.m} เมนู`)
      if (u.c) parts.push(`${u.c} สูตรผสม`)
      msg = `⚠️ วัตถุดิบนี้ถูกใช้ใน ${parts.join(' และ ')}\nลบแล้วต้นทุนของรายการเหล่านั้นจะคำนวณผิด\n\nยืนยันลบ?`
    }
    if (!confirm(msg)) return
    const nextLib = library.filter((x) => x.id !== item.id)
    const { compounds: nc, menus: nm } = recalcAll(nextLib, compounds, menus)
    commit({ library: nextLib, compounds: nc, menus: nm })
    toast('ลบแล้ว', '🗑️')
  }

  const canEdit = session.isEditor()

  const togglePin = (item) => {
    const nextLib = library.map((x) => (x.id === item.id ? { ...x, pinned: !x.pinned } : x))
    commit({ library: nextLib })
  }
  const showUsage = (item) => {
    const u = libUsage(item.id, menus, compounds)
    toast(u.total ? `ใช้ใน ${u.m} เมนู · ${u.c} สูตรผสม` : 'ยังไม่ถูกใช้ที่ไหน', '🔗')
  }

  return (
    <div className="main" style={{ paddingTop: '.6rem' }}>
      <div style={{ fontSize: 12.5, color: 'var(--txt3)', margin: '0 2px .2rem' }}>{library.length} รายการ</div>

      {/* control row: cycle-click filter + คำนวณ + เพิ่ม (2 คอลัมน์) */}
      <div style={{ display: 'flex', gap: 8, margin: '.7rem 0 .9rem' }}>
        <CycleFilter cats={CATS} value={cat} onChange={setCat} emojiOf={(c) => CAT_EMOJI[c] || '🔖'} count={groups.reduce((s, g) => s + g.items.length, 0)} />
        <button className="btn" style={{ background: 'var(--surf2)', flexShrink: 0 }} onClick={() => setShowBd(true)}>🧮</button>
        {canEdit && (
          <button className="btn btn-red" style={{ flexShrink: 0 }} onClick={() => setForm({ item: null })}>＋ เพิ่ม</button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="empty"><span className="empty-icon">📦</span>ยังไม่มีวัตถุดิบ</div>
      ) : groups.map((g) => (
        <div key={g.cat} style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: CAT_COLOR[g.cat] || '#6B7280', margin: '0 2px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {CAT_EMOJI[g.cat] || '🔖'} {g.cat} <span style={{ color: 'var(--txt3)', fontWeight: 500 }}>({g.items.length})</span>
          </div>
          <div className="lib-grid">
            {g.items.map((i) => {
              const baseUnit = i.levels?.[0]?.name || 'ลัง'
              return (
                <div key={i.id} className="lib-card" style={{ padding: '.9rem 1rem' }}>
                  {/* header: pin + emoji + name + category chip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {canEdit && (
                      <button onClick={() => togglePin(i)} title={i.pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: i.pinned ? '#F5C518' : 'var(--txt3)', flexShrink: 0, padding: 0 }}>
                        {i.pinned ? '★' : '☆'}
                      </button>
                    )}
                    <span style={{ fontSize: 19, flexShrink: 0 }}>{itemEmoji(i.name, masterByName)}</span>
                    <div style={{ fontWeight: 700, fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: CAT_COLOR[i.cat] || '#6B7280', background: 'var(--surf2)', borderRadius: 20, padding: '2px 9px', flexShrink: 0 }}>{CAT_EMOJI[i.cat] || '🔖'} {i.cat}</span>
                  </div>

                  {/* two boxes: ราคาต่อหน่วย | ราคาซื้อ */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: 'var(--red-p)', borderRadius: 12, padding: '.7rem .5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--txt3)', fontWeight: 600 }}>ราคาต่อหน่วย</div>
                      <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--red)', lineHeight: 1.15 }}>{baht(i.unitPrice)}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt2)', fontWeight: 600 }}>฿ / {i.unit || 'หน่วย'}</div>
                    </div>
                    <div style={{ flex: 1.35, background: 'var(--surf2)', borderRadius: 12, padding: '.7rem .8rem' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--txt3)', fontWeight: 600 }}>📦 ราคาซื้อ</div>
                      <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--txt)' }}>{baht(i.basePrice || i.price || i.total)} ฿</div>
                      <div style={{ fontSize: 10.5, color: 'var(--txt3)', marginTop: 1 }}>ต่อ 1 {baseUnit}</div>
                      {num(i.qty) > 0 && <div style={{ fontSize: 10.5, color: 'var(--txt3)' }}>= {baht(i.qty).replace('.00', '')} {i.unit}</div>}
                    </div>
                  </div>

                  {/* serving unit pill */}
                  {i.servingUnit && num(i.servingUnit.qty) > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, fontWeight: 600, color: 'var(--purple)', background: 'var(--purple-bg)', border: '1px solid var(--purple-b)', borderRadius: 20, padding: '3px 10px' }}>
                      🥄 1{i.servingUnit.name} = {baht(i.servingUnit.costPerServe ?? num(i.unitPrice) * num(i.servingUnit.qty))} ฿
                    </div>
                  )}

                  {/* buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <button className="btn" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '5px 11px', fontSize: 12, fontWeight: 600 }} onClick={() => showUsage(i)}>🔗 ใช้ในเมนู</button>
                    {canEdit && (
                      <button className="btn" style={{ background: '#FEF9C3', color: '#854D0E', padding: '5px 11px', fontSize: 12, fontWeight: 600 }} onClick={() => setPriceAdj(i)}>↕️ ปรับราคา</button>
                    )}
                    <div style={{ flex: 1 }} />
                    {canEdit && <button className="btn-icon" style={{ fontSize: 14 }} onClick={() => setForm({ item: i })}>✏️</button>}
                    {canEdit && <button className="btn-icon" style={{ fontSize: 14 }} onClick={() => deleteIngredient(i)}>🗑️</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {form && (
        <IngredientForm
          item={form.item}
          library={library}
          updatedBy={session.updatedBy}
          onSave={saveIngredient}
          onClose={() => setForm(null)}
        />
      )}
      {priceAdj && (
        <PriceAdjModal
          item={priceAdj}
          updatedBy={session.updatedBy}
          onSave={savePriceAdj}
          onClose={() => setPriceAdj(null)}
        />
      )}
      {showBd && <BreakdownModal onClose={() => setShowBd(false)} />}
    </div>
  )
}
